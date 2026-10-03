import { formatMoney } from "@ecommerce/contracts";

// Advisory checks over the OCR text of a customer's JazzCash screenshot.
// "missing" only means the text wasn't read — never that the payment is fake
// (compressed screenshots and masked numbers OCR badly). The admin always
// verifies the payment in their own JazzCash app before confirming.
//
// Pure (no browser/OCR imports) so it can be unit-checked from any runtime.

export type ProofCheck = {
  id: "provider" | "status" | "amount" | "account" | "transaction" | "date";
  label: string;
  status: "found" | "missing";
  detail?: string;
};

/** What the OCR actually read, shown next to the checks so the admin sees the evidence. */
export type ProofDetails = {
  amount?: string;
  transactionId?: string;
  dateTime?: string;
  /** Mobile numbers found on the receipt (sender and receiver), normalised to 03xxxxxxxxx. */
  numbers: string[];
};

export type ProofAnalysis = { checks: ProofCheck[]; details: ProofDetails };

type Expected = {
  total: string;
  accountNumber: string;
  /** When the customer submitted the proof (ISO) — the receipt date should be near it. */
  submittedAt?: string;
};

const MONTHS =
  "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";
const TIME = String.raw`(?:[,\sat-]+\d{1,2}:\d{2}(?::\d{2})?\s*(?:[AaPp]\.?[Mm]\.?)?)?`;
const DATE_RES = [
  new RegExp(
    String.raw`\b\d{1,2}[\s-]+(?:${MONTHS})\.?,?[\s-]+\d{2,4}${TIME}`,
    "i",
  ),
  new RegExp(String.raw`\b(?:${MONTHS})\.?\s+\d{1,2},?\s+\d{4}${TIME}`, "i"),
  new RegExp(String.raw`\b\d{4}-\d{2}-\d{2}${TIME}`),
  new RegExp(String.raw`\b\d{1,2}[/.]\d{1,2}[/.]\d{2,4}${TIME}`),
];
const TXN_RE =
  /(?:transaction|trans|txn|trx|tid|reference|ref)\.?\s*(?:id|no|number|#)?\s*[:#-]?\s*((?=[A-Z0-9]*\d)[A-Z0-9]{8,})/i;
const PHONE_RE = /(?:\+?92|0)[\s-]?3\d{2}[\s-]?\d{7}/g;
const AMOUNT_LABELLED =
  /(?:amount|total|paid|sent|rs\.?|pkr)\s*[:.-]?\s*(?:rs\.?|pkr)?\s*(\d[\d,]*(?:\.\d{1,2})?)/gi;
const AMOUNT_DECIMAL = /\b\d[\d,]*\.\d{2}\b/g;

const toNumber = (s: string) => Number(s.replace(/,/g, ""));
const sameAmount = (a: number, b: number) => Math.abs(a - b) < 0.005;
// 0300… / +92300… / 92300… all compare by their last 10 digits.
const last10 = (s: string) => s.replace(/\D/g, "").slice(-10);

function firstDate(text: string): string | undefined {
  for (const re of DATE_RES) {
    const m = text.match(re)?.[0];
    if (m) return m.trim().replace(/\s+/g, " ");
  }
}

// Best-effort parse of what firstDate found; undefined when the format is ambiguous.
function parseDate(s: string): Date | undefined {
  const day = s.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})/);
  if (day) {
    const y = Number(day[3]!.length === 2 ? `20${day[3]}` : day[3]);
    return new Date(y, Number(day[2]) - 1, Number(day[1])); // Pakistan: dd/mm/yyyy
  }
  const d = new Date(s.replace(/\bat\b/i, " "));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function analyzePaymentText(
  text: string,
  expected: Expected,
): ProofAnalysis {
  const total = Number(expected.total);

  // ── amount: prefer figures the receipt labels as an amount; fall back to any
  // "x.xx"-shaped figure. Matching any number at all (as before) hit dates/IDs.
  const labelled = [...text.matchAll(AMOUNT_LABELLED)].map((m) =>
    toNumber(m[1]!),
  );
  const decimals = (text.match(AMOUNT_DECIMAL) ?? []).map(toNumber);
  const candidates = labelled.length ? labelled : decimals;
  const amountFound = [...labelled, ...decimals].some((n) =>
    sameAmount(n, total),
  );
  const amount = amountFound ? total : candidates[0];

  // ── numbers: sender/receiver mobile numbers, normalised.
  const numbers = [
    ...new Set((text.match(PHONE_RE) ?? []).map((n) => `0${last10(n)}`)),
  ];
  const wanted = last10(expected.accountNumber);
  const accountFound =
    wanted.length >= 7 &&
    (numbers.some((n) => last10(n) === wanted) ||
      text.replace(/\D/g, "").includes(wanted));

  // ── transaction id: labelled, else a long digit run that isn't a phone number.
  let txn = text.match(TXN_RE)?.[1];
  if (!txn) {
    txn = (text.match(/\b\d{10,16}\b/g) ?? []).find(
      (n) => !numbers.some((p) => last10(p) === last10(n)),
    );
  }

  // ── date: should sit close to when the customer submitted the proof.
  const dateTime = firstDate(text);
  const parsed = dateTime ? parseDate(dateTime) : undefined;
  const submitted = expected.submittedAt
    ? new Date(expected.submittedAt)
    : undefined;
  const dateOk =
    !!parsed &&
    (!submitted ||
      Math.abs(parsed.getTime() - submitted.getTime()) <= 3 * 86_400_000);

  // ── status words.
  const failed = /\b(?:failed|declined|rejected|unsuccessful|reversed)\b/i.test(
    text,
  );
  const succeeded =
    /\b(?:successful(?:ly)?|success|completed|sent|received|paid)\b/i.test(
      text,
    );

  const checks: ProofCheck[] = [
    {
      id: "provider",
      label: "JazzCash mentioned",
      status: /jazz/i.test(text) ? "found" : "missing",
    },
    {
      id: "status",
      label: "Marked successful",
      status: succeeded && !failed ? "found" : "missing",
      ...(failed ? { detail: "says failed/declined" } : {}),
    },
    {
      id: "amount",
      label: `Amount ${formatMoney(expected.total)}`,
      status: amountFound ? "found" : "missing",
      ...(!amountFound && amount !== undefined
        ? { detail: `read ${formatMoney(String(amount))}` }
        : {}),
    },
    {
      id: "account",
      label: "Your account number",
      status: accountFound ? "found" : "missing",
    },
    {
      id: "transaction",
      label: "Transaction ID",
      status: txn ? "found" : "missing",
      ...(txn ? { detail: txn } : {}),
    },
    {
      id: "date",
      label: "Date near the order",
      status: dateOk ? "found" : "missing",
      ...(dateTime ? { detail: dateTime } : {}),
    },
  ];

  return {
    checks,
    details: {
      ...(amount !== undefined ? { amount: formatMoney(String(amount)) } : {}),
      ...(txn ? { transactionId: txn } : {}),
      ...(dateTime ? { dateTime } : {}),
      numbers,
    },
  };
}

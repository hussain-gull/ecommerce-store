// Self-check for the OCR text analyser: pnpm tsx scripts/check-payment-proof.ts
// (the analyser lives in the admin app; run from here because tsx is installed in the API).
import assert from "node:assert/strict";
import { analyzePaymentText } from "../../admin/src/lib/payment-proof-hints.ts";

const exp = {
  total: "1500.00",
  accountNumber: "03001234567",
  submittedAt: "2026-10-02T09:30:00Z",
};
const get = (r: ReturnType<typeof analyzePaymentText>, id: string) =>
  r.checks.find((c) => c.id === id)!;

// A typical successful receipt.
const good = analyzePaymentText(
  `JazzCash
Transaction Successful
Amount: Rs. 1,500.00
To: 0300 1234567
From: 0312-7654321
Transaction ID 1234567890123
02 Oct 2026 03:12 PM`,
  exp,
);
for (const id of [
  "provider",
  "status",
  "amount",
  "account",
  "transaction",
  "date",
])
  assert.equal(get(good, id).status, "found", id);
assert.equal(good.details.transactionId, "1234567890123");
assert.deepEqual(good.details.numbers.sort(), ["03001234567", "03127654321"]);

// +92 prefix, no "Rs" label, dd/mm/yyyy date.
const alt = analyzePaymentText(
  `Money sent successfully 1,500.00 to +92 300 1234567 Ref No: AB12CD34EF on 02/10/2026`,
  exp,
);
assert.equal(get(alt, "amount").status, "found");
assert.equal(get(alt, "account").status, "found");
assert.equal(get(alt, "date").status, "found");

// Wrong amount is reported, not silently accepted; a date number can't pass as the amount.
const wrong = analyzePaymentText(
  `JazzCash Successful Amount Rs 150.00 Transaction ID 99887766554 to 03001234567 on 15 Oct 2026`,
  exp,
);
assert.equal(get(wrong, "amount").status, "missing");
assert.match(get(wrong, "amount").detail!, /150/);
assert.equal(get(wrong, "date").status, "missing"); // 13 days from submission

// Failed payment is flagged.
const failed = analyzePaymentText(
  `JazzCash Transaction Failed Rs 1500.00`,
  exp,
);
assert.equal(get(failed, "status").status, "missing");

// Garbage / empty OCR → everything missing, no throw.
const empty = analyzePaymentText("", exp);
assert.ok(empty.checks.every((c) => c.status === "missing"));
console.log("payment proof analyser: all scenarios pass");

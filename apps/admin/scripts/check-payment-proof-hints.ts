// Runnable self-check (from apps/api): `pnpm tsx ../admin/scripts/check-payment-proof-hints.ts`
import assert from "node:assert/strict";
import { analyzePaymentText } from "../src/lib/payment-proof-hints";

const by = (r: ReturnType<typeof analyzePaymentText>) =>
  Object.fromEntries(r.map((c) => [c.id, c]));

const good = analyzePaymentText(
  "JazzCash\nPayment Successful\nRs. 5,000.00\nTo 0300 1234567\nTransaction ID: 12345678901",
  { total: "5000.00", accountNumber: "+92 300 1234567" },
);
assert.equal(by(good).provider!.status, "found");
assert.equal(by(good).amount!.status, "found");
assert.equal(by(good).account!.status, "found");
assert.equal(by(good).transaction!.detail, "12345678901");

const bad = analyzePaymentText("hello world 42", {
  total: "5000.00",
  accountNumber: "03001234567",
});
assert.ok(bad.every((c) => c.status === "missing"));

// short/blank configured account must never "match" by accident
const blank = analyzePaymentText("12345", { total: "1", accountNumber: "" });
assert.equal(by(blank).account!.status, "missing");
console.log("payment-proof-hints: ok");

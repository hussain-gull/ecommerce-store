/**
 * Store currency. Customers pay in PKR (JazzCash), so every displayed amount
 * goes through formatMoney — the symbol lives here and nowhere else.
 *
 * The prefix must contain no digits and no ".": the storefront parses price
 * strings with /[^0-9.]/g, and a "Rs." prefix would leave a stray dot ("Rs.4999"
 * → ".4999").
 */
export const CURRENCY_CODE = "PKR";
export const CURRENCY_PREFIX = "Rs ";

/** e.g. formatMoney("4999.00") → "Rs 4999.00", formatMoney(4999) → "Rs 4999.00". */
export function formatMoney(amount: number | string): string {
  return `${CURRENCY_PREFIX}${typeof amount === "number" ? amount.toFixed(2) : amount}`;
}

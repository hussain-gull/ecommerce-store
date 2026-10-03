export type ShippingMethod = "standard" | "express" | "next-day";

// All amounts are PKR in integer minor units (paisa). This is the single source
// for shipping prices — the API totals orders with it and the storefront
// displays it, so they can't drift.
/** Standard delivery is free at or above this subtotal (Rs 10,000). */
export const FREE_SHIPPING_MINOR = 1_000_000;

const FLAT_MINOR: Record<ShippingMethod, number> = {
  standard: 25_000, // Rs 250
  express: 50_000, // Rs 500
  "next-day": 80_000, // Rs 800
};

/** Shipping cost in integer minor units — never floats. */
export function shippingCostMinor(
  method: ShippingMethod,
  subtotalMinor: number,
): number {
  if (method === "standard" && subtotalMinor >= FREE_SHIPPING_MINOR) return 0;
  return FLAT_MINOR[method];
}

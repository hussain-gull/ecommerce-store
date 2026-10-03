import Link from "next/link";
import {
  FREE_SHIPPING_MINOR,
  formatMoney,
  shippingCostMinor,
} from "@ecommerce/contracts";

type CartSummaryProps = {
  subtotal: number;
  /** True when a cart line is sold out or exceeds stock. */
  checkoutBlocked?: boolean;
};

export function CartSummary({
  subtotal,
  checkoutBlocked = false,
}: CartSummaryProps) {
  // Same shipping rule the API totals orders with (shared in @ecommerce/contracts).
  const subtotalMinor = Math.round(subtotal * 100);
  const shipping = shippingCostMinor("standard", subtotalMinor) / 100;
  const freeShipping = shipping === 0;
  const total = subtotal + shipping;

  return (
    <div className="bg-surface border border-line p-6">
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-5 pb-3 border-b border-line">
        Order Summary
      </h2>

      <div className="space-y-3 text-[13px] mb-5">
        <div className="flex justify-between">
          <span className="text-secondary">Subtotal</span>
          <span className="text-foreground font-semibold">
            {formatMoney(subtotal)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-secondary">Shipping</span>
          <span
            className={
              freeShipping
                ? "text-accent font-semibold"
                : "text-foreground font-semibold"
            }
          >
            {freeShipping ? "Free" : formatMoney(shipping)}
          </span>
        </div>
        {!freeShipping && (
          <p className="text-[11px] text-secondary bg-wash px-3 py-2">
            Add{" "}
            <span className="text-accent font-semibold">
              {formatMoney((FREE_SHIPPING_MINOR - subtotalMinor) / 100)}
            </span>{" "}
            more for free shipping.
          </p>
        )}
      </div>

      <div className="flex justify-between text-[14px] font-bold text-foreground border-t border-line pt-4 mb-6">
        <span className="uppercase tracking-widest text-[12px]">Total</span>
        <span>{formatMoney(total)}</span>
      </div>

      {checkoutBlocked ? (
        <>
          <button
            disabled
            className="w-full flex items-center justify-center h-11 bg-muted text-white text-[11px] font-bold tracking-[2px] uppercase cursor-not-allowed mb-2"
          >
            Proceed to Checkout
          </button>
          <p className="text-[11px] text-accent mb-3" role="alert">
            Remove sold-out items to continue.
          </p>
        </>
      ) : (
        <Link
          href="/checkout"
          className="w-full flex items-center justify-center h-11 bg-accent text-white text-[11px] font-bold tracking-[2px] uppercase no-underline hover:bg-accent-dark transition-colors mb-3"
        >
          Proceed to Checkout
        </Link>
      )}

      <Link
        href="/shop"
        className="w-full flex items-center justify-center h-10 bg-transparent border border-line text-foreground text-[11px] font-bold tracking-widest uppercase no-underline hover:border-accent hover:text-accent transition-colors"
      >
        Continue Shopping
      </Link>

      <div className="mt-5 pt-4 border-t border-line">
        <p className="text-[11px] text-secondary uppercase tracking-widest mb-2 font-bold">
          We Accept
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {["VISA", "MC", "AMEX", "PayPal"].map((b) => (
            <span
              key={b}
              className="inline-flex items-center justify-center px-2 h-6 bg-white border border-line text-[9px] font-bold text-secondary"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { formatMoney, shippingCostMinor } from "@ecommerce/contracts";
import type { Cart, ShippingMethod } from "@ecommerce/contracts";

type CheckoutOrderSummaryProps = { cart: Cart; shippingMethod: ShippingMethod };

export function CheckoutOrderSummary({
  cart,
  shippingMethod,
}: CheckoutOrderSummaryProps) {
  // Same rule the API uses to total the order (shared in @ecommerce/contracts).
  const shipping =
    shippingCostMinor(shippingMethod, Math.round(cart.totalPrice * 100)) / 100;
  const freeShipping = shipping === 0;
  const total = cart.totalPrice + shipping;

  return (
    <div className="bg-surface border border-line p-6">
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-5 pb-3 border-b border-line">
        Order Summary
      </h2>

      <ul className="list-none m-0 p-0 space-y-4 mb-5">
        {cart.items.map((item) => (
          <li
            key={`${item.product.id}-${item.size ?? ""}-${item.color ?? ""}`}
            className="flex gap-3 items-start"
          >
            <div className="relative w-14 h-14 bg-wash shrink-0">
              <Image
                src={item.product.img}
                alt={item.product.name}
                fill
                sizes="56px"
                className="object-contain p-1"
                unoptimized
              />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground text-white text-[9px] font-bold flex items-center justify-center">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold uppercase tracking-widest text-foreground leading-tight mb-0.5 truncate">
                {item.product.name}
              </p>
              {item.size && (
                <p className="text-[11px] text-secondary">Size: {item.size}</p>
              )}
              {item.color && (
                <p className="text-[11px] text-secondary">
                  Color: {item.color}
                </p>
              )}
            </div>
            <span className="text-[13px] font-semibold text-foreground shrink-0">
              {item.product.price}
            </span>
          </li>
        ))}
      </ul>

      <div className="border-t border-line pt-4 space-y-2.5 text-[13px] mb-4">
        <div className="flex justify-between">
          <span className="text-secondary">Subtotal</span>
          <span className="text-foreground font-semibold">
            {formatMoney(cart.totalPrice)}
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
      </div>

      <div className="flex justify-between text-[14px] font-bold text-foreground border-t border-line pt-4">
        <span className="uppercase tracking-widest text-[12px]">Total</span>
        <span>{formatMoney(total)}</span>
      </div>

      <p className="text-[11px] text-secondary mt-4 leading-relaxed">
        By placing your order you agree to our{" "}
        <Link
          href="#"
          className="text-accent no-underline hover:text-accent-dark transition-colors"
        >
          Terms & Conditions
        </Link>{" "}
        and{" "}
        <Link
          href="#"
          className="text-accent no-underline hover:text-accent-dark transition-colors"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}

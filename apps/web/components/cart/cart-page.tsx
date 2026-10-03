"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useCart } from "@/hooks/use-cart";
import { useAuthStore } from "@/lib/store/auth.store";
import { fetchAndHydrate } from "@/lib/utils/hydrate-stores";
import { CartLineItem } from "./cart-line-item";
import { CartSummary } from "./cart-summary";

export function CartPage() {
  const { cart, removeItem, addItem } = useCart();
  const userId = useAuthStore((s) => s.user?.id);

  // Someone else may have bought an item since it was added — re-check live stock.
  useEffect(() => {
    if (userId) fetchAndHydrate().catch(() => {});
  }, [userId]);

  const hasUnavailable = cart.items.some(
    (i) => i.availableStock !== undefined && i.availableStock < i.quantity,
  );

  function handleQuantityChange(
    productId: string,
    quantity: number,
    size?: string,
    color?: string,
  ) {
    const item = cart.items.find(
      (i) => i.product.id === productId && i.size === size && i.color === color,
    );
    if (!item) return;
    removeItem(productId, size, color);
    if (quantity > 0) {
      addItem({ ...item, quantity });
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="text-center py-20 bg-surface border border-line">
        <ShoppingBag
          size={40}
          className="text-muted mx-auto mb-4"
          strokeWidth={1.5}
        />
        <p className="text-foreground font-bold text-[13px] uppercase tracking-widest mb-2">
          Your cart is empty
        </p>
        <p className="text-[13px] text-secondary mb-6">
          Add some products and come back here to checkout.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center h-11 px-8 bg-foreground text-white text-[11px] font-bold tracking-[2px] uppercase no-underline hover:bg-accent transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Items */}
      <div className="flex-1 min-w-0">
        <div className="border border-line">
          <div className="hidden sm:grid grid-cols-[1fr_auto] bg-surface px-5 py-3 border-b border-line">
            <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">
              Product
            </span>
            <div className="flex gap-4 items-center">
              <span className="text-[11px] font-bold uppercase tracking-widest text-foreground w-28 text-center">
                Quantity
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-foreground w-16 text-right">
                Subtotal
              </span>
              <span className="w-6" />
            </div>
          </div>

          <div className="px-5">
            <AnimatePresence>
              {cart.items.map((item) => (
                <CartLineItem
                  key={`${item.product.id}-${item.size ?? ""}-${item.color ?? ""}`}
                  item={item}
                  onRemove={removeItem}
                  onQuantityChange={handleQuantityChange}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-5">
          <div className="flex gap-2 flex-1 min-w-0 max-w-xs">
            <input
              type="text"
              placeholder="Coupon code"
              className="flex-1 min-w-0 border border-line bg-white px-3 py-2 text-[13px] text-foreground outline-none focus:border-accent transition-colors"
            />
            <button className="shrink-0 h-9 px-4 bg-foreground text-white border-none text-[11px] font-bold tracking-widest uppercase cursor-pointer hover:bg-accent transition-colors">
              Apply
            </button>
          </div>
          <button
            onClick={() =>
              cart.items.forEach((i) =>
                removeItem(i.product.id, i.size, i.color),
              )
            }
            className="h-9 px-4 bg-transparent border border-line text-foreground text-[11px] font-bold tracking-widest uppercase cursor-pointer hover:border-accent hover:text-accent transition-colors"
          >
            Clear Cart
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="w-full lg:w-80 shrink-0">
        <CartSummary
          subtotal={cart.totalPrice}
          checkoutBlocked={hasUnavailable}
        />
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useWishlist } from "@/hooks/use-wishlist";
import { WishlistItem } from "./wishlist-item";

export function WishlistGrid() {
  const { items, removeItem } = useWishlist();

  if (items.length === 0) {
    return (
      <div className="text-center py-20 bg-surface border border-line">
        <Heart
          size={40}
          className="text-muted mx-auto mb-4"
          strokeWidth={1.5}
        />
        <p className="text-foreground font-bold text-[13px] uppercase tracking-widest mb-2">
          Your wishlist is empty
        </p>
        <p className="text-[13px] text-secondary mb-6">
          Save items you love and come back to them anytime.
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
    <div>
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-line">
        <p className="text-[13px] text-secondary">
          {items.length} {items.length === 1 ? "item" : "items"} saved
        </p>
        <Link
          href="/shop"
          className="text-[11px] font-bold uppercase tracking-widest text-foreground hover:text-accent transition-colors no-underline"
        >
          Continue Shopping
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        <AnimatePresence>
          {items.map((item) => (
            <WishlistItem
              key={item.product.id}
              product={item.product}
              onRemove={removeItem}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingCart, Check } from "lucide-react";
import { AnimatedLetters } from "@/components/ui/animated-letters";
import { useCartStore } from "@/lib/store/cart.store";
import { useCardAdd } from "./use-card-add";
import { useWishlistStore } from "@/lib/store/wishlist.store";
import { useToastStore } from "@/lib/store/toast.store";
import type { Product } from "@ecommerce/contracts";

type ProductCardProps = { product: Product; priority?: boolean };

export function ProductCard({ product, priority }: ProductCardProps) {
  const { soldOut, add } = useCardAdd(product);
  const isInCart = useCartStore((s) =>
    s.items.some((i) => i.product.id === product.id),
  );

  const addToWishlist = useWishlistStore((s) => s.addItem);
  const removeFromWishlist = useWishlistStore((s) => s.removeItem);
  const wishlisted = useWishlistStore((s) =>
    s.items.some((i) => i.product.id === product.id),
  );

  const pushToast = useToastStore((s) => s.push);
  const [justAdded, setJustAdded] = useState(false);

  function handleAddToCart() {
    if (!add()) return;
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  function handleWishlist() {
    if (wishlisted) {
      removeFromWishlist(product.id);
      pushToast("success", "Removed from Wishlist", {
        img: product.img,
        name: product.name,
      });
    } else {
      addToWishlist(product);
      pushToast("success", "Added to Wishlist", {
        img: product.img,
        name: product.name,
      });
    }
  }

  // Persistent label: "In Cart" once added; briefly "Added!" on repeated clicks
  const cartLabel = soldOut
    ? "Sold Out"
    : justAdded
      ? "Added"
      : isInCart
        ? "In Cart"
        : "Add to Cart";
  const cartActive = !soldOut && (isInCart || justAdded);

  return (
    <motion.article
      whileHover="hovered"
      initial="rest"
      animate="rest"
      className="flex w-full flex-col overflow-hidden"
    >
      <div className="relative shrink-0 bg-wash overflow-hidden aspect-square shadow-card transition-shadow duration-300 hover:shadow-card-hover">
        {(soldOut || product.sale) && (
          <span className="absolute top-2.5 right-2.5 z-3 bg-overlay text-wash text-[10px] font-bold tracking-widest px-2 py-0.5 uppercase">
            {soldOut ? "SOLD OUT" : "SALE"}
          </span>
        )}

        {/* Persistent wishlist indicator — always visible, no hover needed */}
        {wishlisted && (
          <span className="absolute top-2 left-2 z-3 w-6 h-6 bg-accent flex items-center justify-center">
            <Heart size={11} fill="currentColor" className="text-wash" />
          </span>
        )}

        <motion.div
          className="absolute inset-0"
          variants={{ rest: { scale: 1 }, hovered: { scale: 1.06 } }}
          transition={{ duration: 0.4 }}
        >
          <Image
            src={product.img}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className={`object-cover ${soldOut ? "opacity-50 grayscale" : ""}`}
            unoptimized
            priority={priority}
          />
        </motion.div>

        {/* Whole image area links to the detail page (action bar sits above at z-4) */}
        <Link
          href={`/products/${product.slug}`}
          aria-label={product.name}
          className="absolute inset-0 z-2"
        />

        <motion.div
          className="absolute bottom-0 left-0 right-0 z-4 flex overflow-hidden"
          variants={{ rest: { y: "100%" }, hovered: { y: 0 } }}
          transition={{ duration: 0.3 }}
        >
          {/* Wishlist — icon only, no text */}
          <button
            onClick={handleWishlist}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`w-11 h-11 border-none cursor-pointer shrink-0 flex items-center justify-center transition-colors ${
              wishlisted
                ? "bg-accent text-wash hover:bg-foreground"
                : "bg-foreground text-wash hover:bg-accent"
            }`}
          >
            <Heart size={14} fill={wishlisted ? "currentColor" : "none"} />
          </button>

          {/* Add to Cart — persists "In Cart" state */}
          <button
            onClick={handleAddToCart}
            disabled={soldOut}
            className={`flex-1 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-1.5 text-[11px] font-bold tracking-widest uppercase h-11 border-none cursor-pointer overflow-hidden transition-colors ${
              cartActive
                ? "bg-accent text-wash"
                : "bg-foreground text-wash hover:bg-accent"
            }`}
          >
            {cartActive ? <Check size={13} /> : <ShoppingCart size={13} />}
            <AnimatePresence mode="wait">
              <motion.span
                key={cartLabel}
                className="flex"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.08 }}
              >
                <AnimatedLetters text={cartLabel} />
              </motion.span>
            </AnimatePresence>
          </button>
        </motion.div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 px-4 pt-4 pb-3">
        <Link href={`/products/${product.slug}`} className="no-underline">
          <motion.h3
            className="text-base font-semibold tracking-wide uppercase line-clamp-1"
            variants={{
              rest: { color: "#252525" },
              hovered: { color: "#f25862" },
            }}
          >
            {product.name}
          </motion.h3>
        </Link>
        {(product.sizes?.length || product.condition) && (
          <div className="text-sm font-semibold text-secondary">
            {product.sizes?.length ? (
              <p className="line-clamp-1">Size: {product.sizes.join(", ")}</p>
            ) : null}
            {product.condition ? (
              <p className="line-clamp-1">Condition: {product.condition}</p>
            ) : null}
          </div>
        )}
        <div className="mt-auto pt-2 text-lg">
          {product.originalPrice && (
            <span className="line-through text-muted mr-2 text-base">
              {product.originalPrice}
            </span>
          )}
          <span
            className={`font-bold ${product.originalPrice ? "text-accent" : "text-foreground"}`}
          >
            {product.price}
          </span>
        </div>
      </div>
    </motion.article>
  );
}

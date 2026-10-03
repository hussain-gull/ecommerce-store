"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Heart, ShoppingCart, Check } from "lucide-react";
import { AnimatedLetters } from "@/components/ui/animated-letters";
import { useCardAdd } from "./use-card-add";
import { useWishlistStore } from "@/lib/store/wishlist.store";
import { useToastStore } from "@/lib/store/toast.store";
import type { Product } from "@ecommerce/contracts";

export function ListCard({ product }: { product: Product }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const { soldOut, add } = useCardAdd(product);
  const addToWishlist = useWishlistStore((s) => s.addItem);
  const removeFromWishlist = useWishlistStore((s) => s.removeItem);
  const wishlisted = useWishlistStore((s) =>
    s.items.some((i) => i.product.id === product.id),
  );
  const pushToast = useToastStore((s) => s.push);

  const [cartAdded, setCartAdded] = useState(false);

  function handleAddToCart() {
    if (!add()) return;
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 1800);
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

  const cartLabel = soldOut ? "Sold Out" : cartAdded ? "Added" : "Add to Cart";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{ duration: 0.5 }}
      className="flex gap-6 py-5 border-b border-line group"
    >
      <Link
        href={`/products/${product.slug}`}
        className="w-48 h-48 bg-wash shrink-0 relative overflow-hidden block no-underline"
      >
        {(soldOut || product.sale) && (
          <span className="absolute top-2 right-2 z-[2] bg-[#333] text-white text-[10px] font-bold px-1.5 py-0.5">
            {soldOut ? "SOLD OUT" : "SALE"}
          </span>
        )}
        <Image
          src={product.img}
          alt={product.name}
          fill
          className="object-contain p-2.5 group-hover:scale-105 transition-transform duration-300"
          unoptimized
        />
      </Link>

      <div className="flex-1">
        <Link href={`/products/${product.slug}`} className="no-underline">
          <h3 className="text-base font-bold uppercase tracking-widest text-foreground group-hover:text-accent transition-colors mb-2">
            {product.name}
          </h3>
        </Link>
        <div className="my-2.5 text-xl font-bold">
          {product.originalPrice && (
            <span className="line-through text-[#aaa] text-base mr-2">
              {product.originalPrice}
            </span>
          )}
          <span
            className={
              product.originalPrice ? "text-accent" : "text-foreground"
            }
          >
            {product.price}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1">
          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={soldOut}
            className={`disabled:cursor-not-allowed disabled:opacity-70 flex items-center gap-2 px-5 py-2 text-[11px] font-bold tracking-widest uppercase border-none cursor-pointer transition-colors overflow-hidden ${
              cartAdded
                ? "bg-accent text-white"
                : "bg-foreground text-white hover:bg-accent"
            }`}
          >
            {cartAdded ? <Check size={12} /> : <ShoppingCart size={12} />}
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

          {/* Wishlist toggle */}
          <button
            onClick={handleWishlist}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`w-9 h-9 border flex items-center justify-center cursor-pointer transition-colors ${
              wishlisted
                ? "border-accent bg-accent text-wash hover:bg-foreground hover:border-foreground"
                : "border-line bg-transparent text-secondary hover:border-accent hover:text-accent"
            }`}
          >
            <Heart size={13} fill={wishlisted ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

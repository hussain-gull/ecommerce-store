"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Trash2, ShoppingCart, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Stars } from "@/components/ui/stars";
import { AnimatedLetters } from "@/components/ui/animated-letters";
import { useCartStore } from "@/lib/store/cart.store";
import { useToastStore } from "@/lib/store/toast.store";
import type { Product } from "@ecommerce/contracts";

type WishlistItemProps = {
  product: Product;
  onRemove: (id: string) => void;
};

export function WishlistItem({ product, onRemove }: WishlistItemProps) {
  const addToCart = useCartStore((s) => s.addItem);
  const pushToast = useToastStore((s) => s.push);
  const [cartAdded, setCartAdded] = useState(false);

  function handleAddToCart() {
    addToCart({ product, quantity: 1 });
    pushToast("success", "Added to Cart", {
      img: product.img,
      name: product.name,
    });
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 1800);
  }

  const cartLabel = cartAdded ? "Added!" : "Add to Cart";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      whileHover="hovered"
    >
      <div className="relative bg-wash overflow-hidden mb-3.5 aspect-square shadow-card transition-shadow duration-300 hover:shadow-card-hover">
        {product.sale && (
          <span className="absolute top-2.5 right-2.5 z-[3] bg-overlay text-white text-[10px] font-bold tracking-widest px-2 py-0.5 uppercase">
            SALE
          </span>
        )}

        <motion.div
          className="absolute inset-0"
          variants={{ rest: { scale: 1 }, hovered: { scale: 1.05 } }}
          transition={{ duration: 0.4 }}
        >
          <Image
            src={product.img}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-2.5"
            unoptimized
          />
        </motion.div>

        <motion.div
          className="absolute bottom-0 left-0 right-0 z-[4] flex overflow-hidden"
          variants={{ rest: { y: "100%" }, hovered: { y: 0 } }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={() => onRemove(product.id)}
            aria-label={`Remove ${product.name} from wishlist`}
            className="w-11 h-11 border-none bg-foreground text-white cursor-pointer shrink-0 flex items-center justify-center hover:bg-accent transition-colors"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={handleAddToCart}
            className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold tracking-widest uppercase h-11 border-none cursor-pointer transition-colors overflow-hidden ${
              cartAdded
                ? "bg-accent text-white"
                : "bg-foreground text-white hover:bg-accent"
            }`}
          >
            {cartAdded ? <Check size={13} /> : <ShoppingCart size={13} />}
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

      <Link href={`/products/${product.slug}`} className="no-underline">
        <motion.h3
          className="text-xs font-bold tracking-widest uppercase mb-1.5"
          variants={{
            rest: { color: "#252525" },
            hovered: { color: "#f25862" },
          }}
        >
          {product.name}
        </motion.h3>
      </Link>
      <Stars rating={product.rating} />
      <div className="mt-1.5 text-sm">
        {product.originalPrice && (
          <span className="line-through text-muted mr-1.5 text-[13px]">
            {product.originalPrice}
          </span>
        )}
        <span
          className={`font-semibold ${product.originalPrice ? "text-accent" : "text-foreground"}`}
        >
          {product.price}
        </span>
      </div>
    </motion.article>
  );
}

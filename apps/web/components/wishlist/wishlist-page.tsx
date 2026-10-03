"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Check,
  LayoutGrid,
  List,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import { AnimatedLetters } from "@/components/ui/animated-letters";
import { useWishlistStore } from "@/lib/store/wishlist.store";
import { useCartStore } from "@/lib/store/cart.store";
import { useToastStore } from "@/lib/store/toast.store";
import type { Product } from "@ecommerce/contracts";

// ─── Grid card ───────────────────────────────────────────────────────────────

function GridCard({
  product,
  index,
  onRemove,
}: {
  product: Product;
  index: number;
  onRemove: (id: string) => void;
}) {
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
    setTimeout(() => {
      onRemove(product.id);
    }, 600);
  }

  const cartLabel = cartAdded ? "Added!" : "Add to Cart";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.28, delay: index * 0.05 }}
      whileHover="hovered"
      className="group"
    >
      {/* Image */}
      <div className="relative bg-wash overflow-hidden mb-2 aspect-square">
        {product.sale && (
          <span className="absolute top-1.5 left-1.5 z-[3] bg-accent text-white text-[8px] font-bold tracking-widest px-1.5 py-0.5 uppercase">
            Sale
          </span>
        )}

        {/* Always-visible remove */}
        <button
          onClick={() => onRemove(product.id)}
          aria-label="Remove from wishlist"
          className="absolute top-1.5 right-1.5 z-[5] w-6 h-6 bg-white border border-line flex items-center justify-center cursor-pointer hover:bg-accent hover:border-accent hover:text-white text-accent transition-colors"
        >
          <Heart size={10} fill="currentColor" />
        </button>

        <motion.div
          className="absolute inset-0"
          variants={{ rest: { scale: 1 }, hovered: { scale: 1.06 } }}
          transition={{ duration: 0.4 }}
        >
          <Image
            src={product.img}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 20vw"
            className="object-contain p-2.5"
            unoptimized
          />
        </motion.div>

        {/* Hover bar */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 z-[4] flex overflow-hidden"
          variants={{ rest: { y: "100%" }, hovered: { y: 0 } }}
          transition={{ duration: 0.25 }}
        >
          <button
            onClick={handleAddToCart}
            className={`flex-1 flex items-center justify-center gap-1 text-[9px] font-bold tracking-widest uppercase h-8 border-none cursor-pointer transition-colors overflow-hidden ${
              cartAdded
                ? "bg-accent text-white"
                : "bg-foreground text-white hover:bg-accent"
            }`}
          >
            {cartAdded ? <Check size={11} /> : <ShoppingCart size={11} />}
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

      {/* Meta */}
      <Link href={`/products/${product.slug}`} className="no-underline">
        <motion.p
          className="text-[10px] font-bold tracking-widest uppercase leading-snug truncate mb-1"
          variants={{
            rest: { color: "#252525" },
            hovered: { color: "#f25862" },
          }}
        >
          {product.name}
        </motion.p>
      </Link>
      <p className="text-[11px] font-semibold">
        {product.originalPrice && (
          <span className="line-through text-muted mr-1 text-[10px]">
            {product.originalPrice}
          </span>
        )}
        <span
          className={product.originalPrice ? "text-accent" : "text-foreground"}
        >
          {product.price}
        </span>
      </p>
    </motion.article>
  );
}

// ─── List row ────────────────────────────────────────────────────────────────

function ListRow({
  product,
  index,
  onRemove,
}: {
  product: Product;
  index: number;
  onRemove: (id: string) => void;
}) {
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
    setTimeout(() => {
      onRemove(product.id);
    }, 600);
  }

  const cartLabel = cartAdded ? "Added!" : "Add to Cart";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.28, delay: index * 0.05 }}
      className="flex gap-5 py-4 border-b border-line group items-center"
    >
      <Link
        href={`/products/${product.slug}`}
        className="relative w-20 h-20 bg-wash shrink-0 overflow-hidden block no-underline"
      >
        {product.sale && (
          <span className="absolute top-1 left-1 z-[2] bg-accent text-white text-[8px] font-bold px-1 py-0.5 uppercase">
            Sale
          </span>
        )}
        <Image
          src={product.img}
          alt={product.name}
          fill
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          unoptimized
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/products/${product.slug}`} className="no-underline">
          <p className="text-[11px] font-bold uppercase tracking-widest text-foreground hover:text-accent transition-colors mb-1 truncate">
            {product.name}
          </p>
        </Link>
        <p className="text-[12px]">
          {product.originalPrice && (
            <span className="line-through text-muted mr-1.5 text-[11px]">
              {product.originalPrice}
            </span>
          )}
          <span
            className={`font-semibold ${product.originalPrice ? "text-accent" : "text-foreground"}`}
          >
            {product.price}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleAddToCart}
          className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold tracking-widest uppercase border-none cursor-pointer transition-colors overflow-hidden ${
            cartAdded
              ? "bg-accent text-white"
              : "bg-foreground text-white hover:bg-accent"
          }`}
        >
          {cartAdded ? <Check size={11} /> : <ShoppingCart size={11} />}
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

        <button
          onClick={() => onRemove(product.id)}
          aria-label="Remove from wishlist"
          className="w-8 h-8 border border-line flex items-center justify-center cursor-pointer hover:border-accent hover:text-accent text-secondary transition-colors bg-transparent"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-24 px-4 text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="w-20 h-20 border border-line flex items-center justify-center mb-7"
      >
        <Heart size={32} className="text-muted" strokeWidth={1.2} />
      </motion.div>

      <p className="text-[11px] font-bold uppercase tracking-[3px] text-secondary mb-3">
        Your Wishlist is Empty
      </p>
      <p className="text-[13px] text-secondary max-w-xs leading-relaxed mb-8">
        Save the pieces you love. They&apos;ll wait right here until you&apos;re
        ready.
      </p>

      <Link
        href="/shop"
        className="inline-flex items-center gap-2.5 bg-foreground text-white px-8 h-11 text-[11px] font-bold tracking-[2px] uppercase no-underline hover:bg-accent transition-colors"
      >
        Browse Products
        <ArrowRight size={14} />
      </Link>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const clear = useWishlistStore((s) => s.clear);
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <div className="max-w-300 mx-auto px-4 py-10">
      {/* Page title */}
      <h1 className="text-xl font-bold text-foreground uppercase tracking-widest">
        <span className="text-secondary mr-1.5">/</span>
        Wishlist
        <span className="text-accent">.</span>
      </h1>
      {items.length > 0 && (
        <p className="text-[12px] text-secondary mt-1.5 mb-8">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>
      )}
      {items.length === 0 && <div className="mb-8" />}

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-7 pb-5 border-b border-line gap-4">
            {/* View toggles on the left */}
            <div className="flex gap-1">
              <button
                onClick={() => setView("grid")}
                aria-pressed={view === "grid"}
                aria-label="Grid view"
                className={`w-8 h-8 border flex items-center justify-center cursor-pointer transition-colors ${
                  view === "grid"
                    ? "border-accent bg-accent text-white"
                    : "border-line bg-transparent text-secondary hover:border-accent hover:text-accent"
                }`}
              >
                <LayoutGrid size={13} />
              </button>
              <button
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
                aria-label="List view"
                className={`w-8 h-8 border flex items-center justify-center cursor-pointer transition-colors ${
                  view === "list"
                    ? "border-accent bg-accent text-white"
                    : "border-line bg-transparent text-secondary hover:border-accent hover:text-accent"
                }`}
              >
                <List size={13} />
              </button>
            </div>

            {/* Continue Shopping on the right */}
            <Link
              href="/shop"
              className="hidden sm:flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-foreground hover:text-accent transition-colors no-underline"
            >
              Continue Shopping
              <ArrowRight size={11} />
            </Link>
          </div>

          {/* Products */}
          <AnimatePresence mode="wait">
            {view === "grid" ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-x-3 gap-y-5"
              >
                <AnimatePresence>
                  {items.map((item, i) => (
                    <GridCard
                      key={item.product.id}
                      product={item.product}
                      index={i}
                      onRemove={removeItem}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <AnimatePresence>
                  {items.map((item, i) => (
                    <ListRow
                      key={item.product.id}
                      product={item.product}
                      index={i}
                      onRemove={removeItem}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom strip */}
          <div className="mt-10 pt-7 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href="/shop"
              className="text-[11px] font-bold uppercase tracking-widest text-foreground hover:text-accent transition-colors no-underline flex items-center gap-1.5"
            >
              <ArrowRight size={12} className="rotate-180" />
              Back to Shop
            </Link>

            <div className="flex items-center gap-3">
              <button
                onClick={clear}
                className="inline-flex items-center gap-2 border border-foreground text-foreground px-6 h-10 text-[11px] font-bold tracking-[2px] uppercase bg-transparent cursor-pointer hover:bg-foreground hover:text-white transition-colors"
              >
                Clear All
              </button>
              <Link
                href="/cart"
                className="inline-flex items-center gap-2 border border-foreground text-foreground px-6 h-10 text-[11px] font-bold tracking-[2px] uppercase no-underline hover:bg-foreground hover:text-white transition-colors"
              >
                <ShoppingBag size={13} />
                View Cart
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

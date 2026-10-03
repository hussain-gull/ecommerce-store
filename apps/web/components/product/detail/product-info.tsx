"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Stars } from "@/components/ui/stars";
import { AnimatedLetters } from "@/components/ui/animated-letters";
import { useCartStore } from "@/lib/store/cart.store";
import { useWishlistStore } from "@/lib/store/wishlist.store";
import { useToastStore } from "@/lib/store/toast.store";
import { useStoreRating } from "@/lib/hooks/use-reviews";
import type { ProductDetail } from "@ecommerce/contracts";
import Link from "next/link";

type ProductInfoProps = Pick<
  ProductDetail,
  | "id"
  | "slug"
  | "img"
  | "name"
  | "price"
  | "originalPrice"
  | "rating"
  | "description"
  | "sku"
  | "category"
  | "tags"
  | "sizes"
  | "colors"
  | "variants"
>;

export function ProductInfo({
  id,
  slug,
  img,
  name,
  price,
  originalPrice,
  rating,
  description,
  sku,
  category,
  tags = [],
  sizes = [],
  colors = [],
  variants = [],
}: ProductInfoProps) {
  const [qty, setQty] = useState(1);
  // Start on a variant that exists and is in stock (else the first one).
  const first = variants.find((v) => v.stock > 0) ?? variants[0];
  const [selectedSize, setSelectedSize] = useState(
    first?.size ?? sizes[0] ?? "",
  );
  const [selectedColor, setSelectedColor] = useState(
    first?.colorName ?? colors[0]?.name ?? "",
  );

  const product = {
    id,
    slug,
    img,
    name,
    price,
    originalPrice,
    rating,
  };

  const { rating: storeRating, count: storeReviewCount } = useStoreRating();
  const addToCart = useCartStore((s) => s.addItem);
  const isInCart = useCartStore((s) =>
    s.items.some((i) => i.product.id === id),
  );
  const addToWishlist = useWishlistStore((s) => s.addItem);
  const removeFromWishlist = useWishlistStore((s) => s.removeItem);
  const wishlisted = useWishlistStore((s) =>
    s.items.some((i) => i.product.id === id),
  );
  const pushToast = useToastStore((s) => s.push);
  const [justAdded, setJustAdded] = useState(false);

  // The exact size+colour pair must exist and have stock — never send a guess.
  const variant = variants.find(
    (v) => v.size === selectedSize && v.colorName === selectedColor,
  );
  const unavailable = !variant || variant.stock <= 0;

  function handleAddToCart() {
    if (!variant || variant.stock <= 0) return;
    addToCart({
      product,
      quantity: qty,
      size: variant.size,
      color: variant.colorName,
    });
    pushToast("success", "Added to Cart", { img, name });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  function handleWishlist() {
    if (wishlisted) {
      removeFromWishlist(id);
      pushToast("success", "Removed from Wishlist", { img, name });
    } else {
      addToWishlist(product);
      pushToast("success", "Added to Wishlist", { img, name });
    }
  }

  const cartLabel = unavailable
    ? variant
      ? "Sold Out"
      : "Unavailable"
    : justAdded
      ? "Added"
      : isInCart
        ? "In Cart"
        : "Add to Cart";
  const cartActive = !unavailable && (isInCart || justAdded);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground uppercase tracking-widest mb-3">
        {name}
      </h1>
      <Stars rating={storeRating} count={storeReviewCount} size={16} />

      <div className="my-4 text-[22px] font-bold">
        {originalPrice && (
          <span className="line-through text-[#aaa] text-base mr-2.5">
            {originalPrice}
          </span>
        )}
        <span className={originalPrice ? "text-accent" : "text-foreground"}>
          {price}
        </span>
      </div>

      <p className="text-sm text-secondary leading-[1.8] mb-6">{description}</p>

      {sizes.length > 0 && (
        <div className="mb-4">
          <label className="text-xs font-bold tracking-widest uppercase text-foreground block mb-2">
            Size
          </label>
          <div className="flex gap-2 flex-wrap">
            {sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                aria-pressed={s === selectedSize}
                className={`w-10 h-10 border-2 text-[13px] font-semibold bg-transparent cursor-pointer transition-colors ${s === selectedSize ? "border-accent text-accent" : "border-line text-foreground hover:border-accent hover:text-accent"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div className="mb-5">
          <label className="text-xs font-bold tracking-widest uppercase text-foreground block mb-2">
            Color:{" "}
            <span className="font-normal normal-case text-secondary">
              {selectedColor}
            </span>
          </label>
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedColor(c.name)}
                title={c.name}
                aria-label={`Color: ${c.name}`}
                aria-pressed={c.name === selectedColor}
                style={{ backgroundColor: c.hex }}
                className={`w-7 h-7 rounded-full cursor-pointer p-0 transition-all ${c.name === selectedColor ? "border-[3px] border-foreground" : "border-2 border-line"}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-5 items-center">
        <div className="flex border border-line h-11">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="w-9 bg-transparent border-none text-lg cursor-pointer text-foreground hover:text-accent transition-colors"
          >
            −
          </button>
          <span
            className="w-11 flex items-center justify-center text-sm font-semibold"
            aria-live="polite"
          >
            {qty}
          </span>
          <button
            onClick={() => setQty((q) => q + 1)}
            aria-label="Increase quantity"
            className="w-9 bg-transparent border-none text-lg cursor-pointer text-foreground hover:text-accent transition-colors"
          >
            +
          </button>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={unavailable}
          className={`disabled:cursor-not-allowed disabled:opacity-60 flex-1 h-11 border-none text-xs font-bold tracking-[2px] uppercase cursor-pointer transition-colors overflow-hidden flex items-center justify-center ${cartActive ? "bg-accent text-white" : "bg-foreground text-white hover:bg-accent"}`}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={cartLabel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.08 }}
            >
              <AnimatedLetters text={cartLabel} />
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      <button
        onClick={handleWishlist}
        className={`flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-[13px] mb-6 transition-colors ${wishlisted ? "text-accent" : "text-secondary hover:text-accent"}`}
      >
        <Heart
          size={14}
          fill={wishlisted ? "currentColor" : "none"}
          stroke="currentColor"
        />
        {wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      </button>

      <div className="border-t border-line pt-5 text-[13px] text-secondary">
        <div className="mb-1.5">
          <span className="text-foreground font-semibold">SKU:</span> {sku}
        </div>
        <div className="mb-1.5">
          <span className="text-foreground font-semibold">Category:</span>{" "}
          <Link
            href="#"
            className="text-secondary hover:text-accent transition-colors no-underline"
          >
            {category}
          </Link>
        </div>
        {tags.length > 0 && (
          <div>
            <span className="text-foreground font-semibold">Tags:</span>{" "}
            {tags.map((t, i) => (
              <span key={t}>
                <Link
                  href="#"
                  className="text-secondary hover:text-accent transition-colors no-underline"
                >
                  {t}
                </Link>
                {i < tags.length - 1 && ", "}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import type { Product } from "@ecommerce/contracts";
import { useCartStore } from "@/lib/store/cart.store";
import { useToastStore } from "@/lib/store/toast.store";
import { isSoldOut, onlyVariant } from "@/lib/utils/variants";

// Cards add a line only when the variant is unambiguous, always with its full
// size + colour; otherwise the shopper picks on the product page. Returns true
// when a line was added (so the card can play its "Added" animation).
export function useCardAdd(product: Product) {
  const router = useRouter();
  const addToCart = useCartStore((s) => s.addItem);
  const pushToast = useToastStore((s) => s.push);
  const soldOut = isSoldOut(product);

  function add(): boolean {
    if (soldOut) return false;
    const v = onlyVariant(product);
    if (!v) {
      pushToast("success", "Choose a size & colour", {
        img: product.img,
        name: product.name,
      });
      router.push(`/products/${product.slug}`);
      return false;
    }
    addToCart({ product, quantity: 1, size: v.size, color: v.colorName });
    pushToast("success", "Added to Cart", {
      img: product.img,
      name: product.name,
    });
    return true;
  }

  return { soldOut, add };
}

"use client";

import { useCartStore } from "@/lib/store/cart.store";
import type { Cart } from "@ecommerce/contracts";

export function useCart() {
  const { items, totalItems, totalPrice, addItem, removeItem, clearCart } =
    useCartStore();
  const cart: Cart = { items, totalItems, totalPrice };
  return { cart, addItem, removeItem, clearCart };
}

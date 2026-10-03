"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Cart, CartItem } from "@ecommerce/contracts";
import {
  addCartItemApi,
  removeCartItemApi,
  clearCartApi,
} from "../api/cart.api";
import { useAuthStore } from "./auth.store";

function calcTotals(
  items: CartItem[],
): Pick<Cart, "totalItems" | "totalPrice"> {
  return {
    totalItems: items.reduce((s, i) => s + i.quantity, 0),
    totalPrice: items.reduce((s, i) => {
      const raw = parseFloat(i.product.price.replace(/[^0-9.]/g, "")) || 0;
      return s + raw * i.quantity;
    }, 0),
  };
}

function isLoggedIn(): boolean {
  return !!useAuthStore.getState().user;
}

type CartState = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size?: string, color?: string) => void;
  clearCart: () => void;
  /** Bulk-replace used after login/signup merge and on app-start hydration. No DB sync. */
  replaceItems: (items: CartItem[]) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,

      addItem: (item) => {
        const existing = get().items.find(
          (i) =>
            i.product.id === item.product.id &&
            i.size === item.size &&
            i.color === item.color,
        );
        const next = existing
          ? get().items.map((i) =>
              i === existing
                ? { ...i, quantity: i.quantity + item.quantity }
                : i,
            )
          : [...get().items, item];
        set({ items: next, ...calcTotals(next) });

        // Server lines always name their variant; legacy size-less items stay local.
        if (isLoggedIn() && item.size && item.color) {
          addCartItemApi({
            productId: item.product.id,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          }).catch(() => {});
        }
      },

      removeItem: (productId, size, color) => {
        const next = get().items.filter(
          (i) =>
            !(
              i.product.id === productId &&
              i.size === size &&
              i.color === color
            ),
        );
        set({ items: next, ...calcTotals(next) });

        if (isLoggedIn()) {
          removeCartItemApi(productId, size, color).catch(() => {});
        }
      },

      clearCart: () => {
        set({ items: [], totalItems: 0, totalPrice: 0 });
        if (isLoggedIn()) clearCartApi().catch(() => {});
      },

      replaceItems: (items) => {
        set({ items, ...calcTotals(items) });
      },
    }),
    { name: "cart" },
  ),
);

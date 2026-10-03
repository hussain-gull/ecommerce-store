"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WishlistItem, Product } from "@ecommerce/contracts";
import {
  addWishlistItemApi,
  removeWishlistItemApi,
  clearWishlistApi,
} from "../api/wishlist.api";
import { useAuthStore } from "./auth.store";

function isLoggedIn(): boolean {
  return !!useAuthStore.getState().user;
}

type WishlistState = {
  items: WishlistItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clear: () => void;
  /** Bulk-replace used after login/signup merge and on app-start hydration. No DB sync. */
  replaceItems: (items: WishlistItem[]) => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        if (get().items.some((i) => i.product.id === product.id)) return;
        set((s) => ({
          items: [...s.items, { product, addedAt: new Date().toISOString() }],
        }));
        if (isLoggedIn()) {
          addWishlistItemApi({ productId: product.id }).catch(() => {});
        }
      },

      removeItem: (productId) => {
        set((s) => ({
          items: s.items.filter((i) => i.product.id !== productId),
        }));
        if (isLoggedIn()) {
          removeWishlistItemApi(productId).catch(() => {});
        }
      },

      isInWishlist: (productId) =>
        get().items.some((i) => i.product.id === productId),

      clear: () => {
        set({ items: [] });
        if (isLoggedIn()) clearWishlistApi().catch(() => {});
      },

      replaceItems: (items) => {
        set({ items });
      },
    }),
    { name: "wishlist" },
  ),
);

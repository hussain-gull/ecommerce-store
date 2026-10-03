import type { Address } from "./order.js";
import type { Product } from "./product.js";

export type Customer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  addresses: Address[];
};

export type WishlistItem = {
  product: Product;
  addedAt: string;
};

// ── DB / API types ────────────────────────────────────────────────────────────

export type DbWishlistItem = {
  id: string;
  productId: string;
  addedAt: string;
};

export type AddWishlistItemPayload = {
  productId: string;
};

export type MergeWishlistPayload = {
  items: AddWishlistItemPayload[];
};

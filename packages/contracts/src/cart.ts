import type { Product } from "./product.js";

export type CartItem = {
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
  /** Live stock for this size/color; 0 = sold out. Absent for guest/local items. */
  availableStock?: number;
};

export type Cart = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
};

// ── DB / API types ────────────────────────────────────────────────────────────

export type DbCartItem = {
  id: string;
  productId: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
  addedAt: string;
  /** Live stock for this size/color (0 = sold out). Populated by GET /cart only. */
  availableStock?: number;
};

/** A cart line always names its exact variant — size AND colour (the colour name). */
export type AddCartItemPayload = {
  productId: string;
  quantity: number;
  size: string;
  color: string;
};

/** Guest carts saved before variants were mandatory may lack size/colour; the server resolves or drops them. */
export type MergeCartPayload = {
  items: (Omit<AddCartItemPayload, "size" | "color"> & {
    size?: string;
    color?: string;
  })[];
};

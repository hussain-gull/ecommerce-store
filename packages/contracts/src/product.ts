export type ProductColor = {
  name: string;
  hex: string;
};

/** One purchasable size+colour of a product, with live stock (0 = sold out). */
export type ProductVariantStock = {
  size: string;
  colorName: string;
  colorHex: string;
  stock: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  price: string;
  salePrice?: string;
  originalPrice?: string;
  rating: number;
  img: string;
  sale?: boolean;
  category?: string;
  brand?: string;
  gender?: "Men" | "Women" | "Kids";
  surface?: string;
  colour?: string;
  sizes?: string[];
  /** Every variant with its stock — lets cards add the exact variant and show SOLD OUT. */
  variants?: ProductVariantStock[];
  /** Name of the product's condition (filter_options kind="condition"). */
  condition?: string;
};

export type ProductVariant = {
  id: string;
  size?: string;
  color?: ProductColor;
  price: string;
  stock: number;
};

export type GalleryImage = { type: "image"; src: string };
export type GalleryVideo = { type: "video"; src: string; poster: string };
export type GalleryMedia = GalleryImage | GalleryVideo;

export type ProductDetail = Product & {
  sku: string;
  description: string;
  media: GalleryMedia[];
  sizes?: string[];
  colors?: ProductColor[];
  tags?: string[];
  reviewCount?: number;
  relatedProducts?: Product[];
};

// ── DB / admin-panel types ──────────────────────────────────────────────────

export type ProductVariantInput = {
  /** Existing variant row — omit for a new one. */
  id?: string;
  /** Required — every variant is a concrete size + colour (carts match on both). */
  size: string;
  /** Named from the hex by the admin colour picker. */
  colorName: string;
  colorHex: string;
  /** Desired stock. */
  stock: number;
  /**
   * Stock the admin form loaded. When present, the server applies
   * `stock - baseStock` to the *current* stock instead of overwriting it, so
   * orders placed while the form was open are never lost.
   */
  baseStock?: number;
};

export type ProductMediaInput = {
  type: "image" | "video";
  url: string;
  posterUrl?: string;
};

// Full admin-facing shape of a product row — includes draft/SEO fields the
// public storefront types (Product/ProductDetail) never expose.
export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: string;
  salePrice?: string;
  sku: string;
  category: string;
  brand?: string;
  gender?: "Men" | "Women" | "Kids";
  surface?: string;
  /** FK to filter_options (kind="condition"). */
  conditionId?: string;
  tags: string[];
  isPublished: boolean;
  metaTitle?: string;
  metaDescription?: string;
  variants: (ProductVariantInput & { id: string })[];
  media: (ProductMediaInput & { id: string })[];
  createdAt: string;
  updatedAt: string;
};

export type CreateProductPayload = {
  slug: string;
  name: string;
  description: string;
  price: string;
  salePrice?: string;
  sku: string;
  category: string;
  brand?: string;
  gender?: "Men" | "Women" | "Kids";
  surface?: string;
  /** filter_options id (kind="condition"); null clears it on update. */
  conditionId?: string | null;
  tags?: string[];
  isPublished?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  variants: ProductVariantInput[];
  media?: ProductMediaInput[];
};

export type UpdateProductPayload = Partial<CreateProductPayload>;

/** A variant with 1..LOW_STOCK_THRESHOLD units left counts as "low stock". */
export const LOW_STOCK_THRESHOLD = 2;

/** Products per tab — drives the tab badges without loading the list. */
export type AdminProductCounts = {
  all: number;
  published: number;
  draft: number;
};

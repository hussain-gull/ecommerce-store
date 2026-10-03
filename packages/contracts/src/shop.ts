import type { Product } from "./product";

export const SHOP_PAGE_SIZE = 12;
export const SHOP_SORTS = [
  "default",
  "price-asc",
  "price-desc",
  "newest",
] as const;
export const SHOP_FACET_KEYS = [
  "category",
  "surface",
  "size",
  "brand",
  "colour",
  "condition",
  "gender",
] as const;

export type ShopSort = (typeof SHOP_SORTS)[number];
export type ShopFacetKey = (typeof SHOP_FACET_KEYS)[number];

/** Body of `QUERY /api/v1/products` — every storefront filter, validated by `shopQuerySchema`. */
export type ShopQuery = Record<ShopFacetKey, string[]> & {
  q: string;
  minPrice?: number;
  maxPrice?: number;
  sort: ShopSort;
  page: number;
};

export type ShopFacetOption = {
  value: string;
  /** Products matching every OTHER active filter (0 = greyed out / hidden). */
  count: number;
  /** Category rows only: their surfaces, counted within that category. */
  children?: { value: string; count: number }[];
};

export type ShopQueryResult = {
  items: Product[];
  total: number;
  /** Clamped to the last page when the requested one is out of range. */
  page: number;
  pageCount: number;
  facets: Record<ShopFacetKey, ShopFacetOption[]>;
  /** Whole published catalogue, so the price slider doesn't move with filters. */
  priceBounds: { min: number; max: number };
};

/** Slim product row for the top-bar search dropdown. */
export type ProductSuggestion = Pick<
  Product,
  "id" | "name" | "slug" | "price" | "salePrice" | "img" | "brand"
>;

import type { ShopQueryResult } from "@ecommerce/contracts";
import type { Product } from "@ecommerce/contracts";
import type { FacetKey, ShopFilters } from "@/lib/shop/params";

// Filtering, sorting, paging and facet counts all happen in the API
// (QUERY /api/v1/products); this module only decorates its answer with the
// sidebar's display config and the shopper's current selections.

export type FacetOption = {
  value: string;
  count: number;
  selected: boolean;
  // Category rows carry their surfaces, shown as a hover dropdown.
  children?: FacetOption[];
};
export type Facet = {
  key: FacetKey;
  label: string;
  display: "list" | "grid";
  defaultOpen: boolean;
  options: FacetOption[];
};
export type ShopResult = {
  items: Product[];
  total: number;
  page: number;
  pageCount: number;
  facets: Facet[];
  priceBounds: { min: number; max: number };
};

// Sidebar config: order = how shoppers decide. Adding a filter = one entry here
// (plus its key in SHOP_FACET_KEYS and a clause in the API's shop-query service).
const FACET_CONFIG: Omit<Facet, "options">[] = [
  { key: "category", label: "Categories", display: "list", defaultOpen: true },
  { key: "brand", label: "Brands", display: "list", defaultOpen: true },
  { key: "size", label: "Size (UK)", display: "grid", defaultOpen: true },
  { key: "gender", label: "Shop For", display: "list", defaultOpen: true },
  { key: "condition", label: "Condition", display: "list", defaultOpen: true },
  { key: "colour", label: "Colour", display: "list", defaultOpen: false },
];

export function toShopResult(r: ShopQueryResult, f: ShopFilters): ShopResult {
  return {
    items: r.items,
    total: r.total,
    page: r.page,
    pageCount: r.pageCount,
    priceBounds: r.priceBounds,
    facets: FACET_CONFIG.map((c) => ({
      ...c,
      options: r.facets[c.key]
        // Sizes stay (greyed out) so the grid doesn't reflow; other empty options hide.
        .filter(
          (o) => c.key === "size" || o.count > 0 || f[c.key].includes(o.value),
        )
        .map((o) => ({
          value: o.value,
          count: o.count,
          selected: f[c.key].includes(o.value),
          children: o.children?.map((ch) => ({
            ...ch,
            selected: f.surface.includes(ch.value),
          })),
        })),
    })),
  };
}

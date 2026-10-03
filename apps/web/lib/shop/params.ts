// Shop filter state lives only in the URL. This module is shared by the server
// page (parse) and the client islands (build hrefs), so it must stay free of
// server- or browser-only imports.

import {
  SHOP_FACET_KEYS,
  SHOP_PAGE_SIZE,
  type ShopFacetKey,
  type ShopQuery,
  type ShopSort,
} from "@ecommerce/contracts";

// The filter vocabulary (keys, sorts, page size, query shape) lives in
// @ecommerce/contracts — the same one the API validates against.
export type { ShopSort };
export type FacetKey = ShopFacetKey;
export type ShopFilters = ShopQuery;
export const FACET_KEYS: FacetKey[] = [...SHOP_FACET_KEYS];
export const PAGE_SIZE = SHOP_PAGE_SIZE;

// Labels for the sort dropdown, in `SHOP_SORTS` order.
export const SORT_OPTIONS: { value: ShopSort; label: string }[] = [
  { value: "default", label: "Default sorting" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "newest", label: "Newest first" },
];

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function list(v: string | string[] | undefined) {
  const raw = first(v);
  return raw ? [...new Set(raw.split(",").filter(Boolean))].sort() : [];
}

function toInt(v: string | undefined) {
  const n = Number(v);
  return v && Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

export function parseShopParams(sp: RawSearchParams): ShopFilters {
  const [min, max] = (first(sp.price) ?? "").split("-");
  const sort = first(sp.sort);
  return {
    ...(Object.fromEntries(FACET_KEYS.map((k) => [k, list(sp[k])])) as Record<
      FacetKey,
      string[]
    >),
    q: (first(sp.q) ?? "").trim().slice(0, 100),
    minPrice: toInt(min),
    maxPrice: toInt(max),
    sort: SORT_OPTIONS.some((o) => o.value === sort)
      ? (sort as ShopSort)
      : "default",
    page: Math.max(1, toInt(first(sp.page)) ?? 1),
  };
}

// Fixed key order + sorted values: identical filters always produce the same
// URL, which keeps router/CDN caches effective and avoids duplicate pages.
export function toQueryString(f: ShopFilters) {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  for (const key of FACET_KEYS) {
    if (f[key].length) params.set(key, [...f[key]].sort().join(","));
  }
  if (f.minPrice !== undefined || f.maxPrice !== undefined) {
    params.set("price", `${f.minPrice ?? 0}-${f.maxPrice ?? ""}`);
  }
  if (f.sort !== "default") params.set("sort", f.sort);
  if (f.page > 1) params.set("page", String(f.page));
  const qs = params.toString().replaceAll("%2C", ",");
  return qs ? `?${qs}` : "";
}

// Any filter change sends the shopper back to page 1 unless a page is given.
export function shopHref(f: ShopFilters, patch: Partial<ShopFilters>) {
  return `/shop${toQueryString({ ...f, page: 1, ...patch })}`;
}

export function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((v) => v !== value)
    : [...values, value];
}

export function activeFilterCount(f: ShopFilters) {
  return (
    FACET_KEYS.reduce((n, k) => n + f[k].length, 0) +
    (f.minPrice !== undefined || f.maxPrice !== undefined ? 1 : 0) +
    (f.q ? 1 : 0)
  );
}

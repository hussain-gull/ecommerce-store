/**
 * Admin-managed filter taxonomy. Covers every shop-filter facet the admin
 * panel can curate: category, brand, surface, size, colour, condition.
 *
 * `gender` is deliberately NOT a FilterOptionKind — it's a fixed 3-value
 * enum ("Men" | "Women" | "Kids") validated by Zod on the product schema,
 * not an open admin-curated vocabulary. Slugifying it would break that enum.
 */
export const FILTER_OPTION_KINDS = [
  "category",
  "brand",
  "surface",
  "size",
  "colour",
  "condition",
] as const;

export type FilterOptionKind = (typeof FILTER_OPTION_KINDS)[number];

export type FilterOption = {
  id: string;
  kind: FilterOptionKind;
  name: string;
  slug: string;
  /** Swatch colour ("#rrggbb"). Only set for kind="colour". */
  hex: string | null;
  /** Only meaningful for kind="category" — the parent category's id, or null for a top-level category. */
  parentId: string | null;
  createdAt: string;
};

export type CreateFilterOptionPayload = {
  kind: FilterOptionKind;
  name: string;
  /** Swatch colour ("#rrggbb"). Only accepted for kind="colour". */
  hex?: string | null;
  /** Only accepted for kind="category" — creates this option as a subcategory of the given category id. */
  parentId?: string | null;
};

export type UpdateFilterOptionPayload = {
  name: string;
  /** Swatch colour ("#rrggbb"). Only accepted for kind="colour". */
  hex?: string | null;
  /** Only accepted for kind="category". Pass null to promote a subcategory to top-level. */
  parentId?: string | null;
};

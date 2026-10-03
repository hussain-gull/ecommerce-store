import type { Product } from "@ecommerce/contracts";

/** True when the product has variants and none has stock. Unknown (no variants loaded) is not sold out. */
export const isSoldOut = (p: Pick<Product, "variants">) =>
  !!p.variants?.length && p.variants.every((v) => v.stock <= 0);

/** The one in-stock variant a card can add directly; undefined when the shopper must choose. */
export function onlyVariant(p: Pick<Product, "variants">) {
  const inStock = p.variants?.filter((v) => v.stock > 0) ?? [];
  return inStock.length === 1 ? inStock[0] : undefined;
}

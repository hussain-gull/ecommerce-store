import { db } from "../prisma/db.js";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// ponytail: compare-and-swap retries, the SQL builder can't express
// `stock = stock - n`. Swap for raw SQL if contention makes 3 retries too few.
const CAS_RETRIES = 3;

// Adds `delta` (negative = take) to a variant's stock with compare-and-swap
// (`UPDATE … WHERE stock = <value read>`), so two concurrent writers can never
// both win the last unit. Returns false if it would go below zero (unless
// `clamp`, which floors at 0 instead — used for admin corrections) or the row
// kept changing under us.
export async function adjustStock(
  tx: Tx,
  variantId: string,
  delta: number,
  opts: { clamp?: boolean } = {},
): Promise<boolean> {
  for (let i = 0; i < CAS_RETRIES; i++) {
    const fresh = await tx.orm.public.product_variants
      .where({ id: variantId })
      .first();
    if (!fresh) return false;
    const next = fresh.stock + delta;
    if (next < 0 && !opts.clamp) return false;
    const plan = tx.sql.public.product_variants
      .update({ stock: Math.max(0, next) })
      .where((f, fns) =>
        fns.and(fns.eq(f.id, fresh.id), fns.eq(f.stock, fresh.stock)),
      )
      .build();
    if ((await tx.execute(plan)).affectedRows === 1) return true;
  }
  return false;
}

// A swatch picked without a name is labelled by its hex on the storefront
// (see rowToProductDetail), so carts send that label back — match on the same.
const variantColor = (v: {
  color_name: string | null;
  color_hex: string | null;
}) => v.color_name ?? v.color_hex;

// Picks the variant a cart/order line refers to. Lines added straight from a
// product card carry no size/colour (or only one of them); when the fields that
// ARE present narrow it to exactly one variant that's unambiguous, so it
// matches — else a one-size product reads "sold out". Ambiguous → no match.
export function findVariant<
  V extends {
    size: string | null;
    color_name: string | null;
    color_hex: string | null;
  },
>(variants: V[], size: string | null, color: string | null): V | undefined {
  const exact = variants.find(
    (v) => v.size === size && variantColor(v) === color,
  );
  if (exact) return exact;
  const narrowed = variants.filter(
    (v) =>
      (size === null || v.size === size) &&
      (color === null || variantColor(v) === color),
  );
  return narrowed.length === 1 ? narrowed[0] : undefined;
}

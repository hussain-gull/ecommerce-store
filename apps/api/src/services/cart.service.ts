import type {
  DbCartItem,
  AddCartItemPayload,
  MergeCartPayload,
} from "@ecommerce/contracts";
import { db } from "../prisma/db.js";
import { nowUtc } from "../utils/datetime.util.js";
import { uuidv7 } from "../utils/uuid.util.js";
import { createHttpError } from "../utils/response.util.js";
import { findVariant } from "./stock.service.js";

// ── mapper ────────────────────────────────────────────────────────────────────

function rowToDbCartItem(row: {
  id: string;
  product_id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  added_at: string;
}): DbCartItem {
  return {
    id: row.id,
    productId: row.product_id,
    quantity: row.quantity,
    size: row.size ?? undefined,
    color: row.color ?? undefined,
    addedAt: row.added_at,
  };
}

// ── service functions ─────────────────────────────────────────────────────────

// Live stock per cart line, so the storefront can show "Sold out" when someone
// else bought the item after it was added. Unpublished/deleted products and
// size/color combos with no variant row count as 0 — same rule the order
// service enforces at purchase time.
export async function getCartService(userId: string): Promise<DbCartItem[]> {
  const rows = await db.orm.public.cart_items
    .where({ user_id: userId })
    .orderBy((c) => c.id.asc())
    .all();
  if (rows.length === 0) return [];

  const ids = [...new Set(rows.map((r) => r.product_id))];
  const [live, variants] = await Promise.all([
    db.orm.public.products
      .select("id")
      .where((p) => p.id.in(ids))
      .where({ is_published: true, deleted_at: null })
      .all(),
    db.orm.public.product_variants.where((v) => v.product_id.in(ids)).all(),
  ]);
  const liveIds = new Set(live.map((p) => p.id));

  return rows.map((row) => {
    const variant = findVariant(
      variants.filter((v) => v.product_id === row.product_id),
      row.size,
      row.color,
    );
    return {
      ...rowToDbCartItem(row),
      availableStock: liveIds.has(row.product_id) ? (variant?.stock ?? 0) : 0,
    };
  });
}

export async function addCartItemService(
  userId: string,
  payload: AddCartItemPayload,
): Promise<DbCartItem> {
  const { productId, quantity, size, color } = payload;
  const sizeVal = size;
  const colorVal = color;

  // No DB-level FK — enforced here, service-layer, per project convention.
  const product = await db.orm.public.products
    .select("id")
    .where({ id: productId, is_published: true })
    .first();
  if (!product) throw createHttpError(404, "Product not found.");

  // The line must name a variant that exists (exact size + colour) and has stock,
  // so nothing unmatchable ever reaches the cart.
  const variant = (
    await db.orm.public.product_variants.where({ product_id: productId }).all()
  ).find((v) => v.size === sizeVal && v.color_name === colorVal);
  if (!variant) {
    throw createHttpError(
      422,
      "That size/colour isn't available for this product.",
    );
  }
  if (variant.stock <= 0) throw createHttpError(409, "Sold out.");

  // NULL-safe uniqueness check: treat (user, product, null size, null color)
  // as one slot, same as (user, product, 'M', 'Black').
  const existing = await db.orm.public.cart_items
    .where({
      user_id: userId,
      product_id: productId,
      size: sizeVal,
      color: colorVal,
    })
    .first();

  if (existing) {
    const newQuantity = Math.min(existing.quantity + quantity, 99);
    await db.orm.public.cart_items
      .where({ id: existing.id })
      .update({ quantity: newQuantity });
    return rowToDbCartItem({ ...existing, quantity: newQuantity });
  }

  const row = await db.orm.public.cart_items.create({
    id: uuidv7(),
    user_id: userId,
    product_id: productId,
    quantity: Math.min(quantity, 99),
    size: sizeVal,
    color: colorVal,
    added_at: nowUtc() as any,
  });
  return rowToDbCartItem(row);
}

export async function removeCartItemService(
  userId: string,
  productId: string,
  size?: string,
  color?: string,
): Promise<void> {
  await db.orm.public.cart_items
    .where({
      user_id: userId,
      product_id: productId,
      size: size ?? null,
      color: color ?? null,
    })
    .delete();
}

export async function clearCartService(userId: string): Promise<void> {
  await db.orm.public.cart_items.where({ user_id: userId }).deleteAndCount();
}

// Upserts every guest item and returns the full merged cart.
// Used after login/signup to persist locally-accumulated guest items.
export async function mergeCartService(
  userId: string,
  payload: MergeCartPayload,
): Promise<DbCartItem[]> {
  for (const item of payload.items) {
    // Old guest lines may lack size/colour: resolve them to the one variant the
    // fields present allow, else drop the line (never fail the whole merge).
    const variants = await db.orm.public.product_variants
      .where({ product_id: item.productId })
      .all();
    const v = findVariant(variants, item.size ?? null, item.color ?? null);
    if (!v) continue;
    await addCartItemService(userId, {
      ...item,
      size: v.size,
      color: v.color_name,
    }).catch(() => {}); // sold out / unpublished → skip this line only
  }
  return getCartService(userId);
}

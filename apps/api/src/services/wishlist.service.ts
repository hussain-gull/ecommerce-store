import type {
  DbWishlistItem,
  AddWishlistItemPayload,
  MergeWishlistPayload,
} from "@ecommerce/contracts";
import { db } from "../prisma/db.js";
import { nowUtc } from "../utils/datetime.util.js";
import { uuidv7 } from "../utils/uuid.util.js";
import { createHttpError } from "../utils/response.util.js";

// ── mapper ────────────────────────────────────────────────────────────────────

function rowToDbWishlistItem(row: {
  id: string;
  product_id: string;
  added_at: string;
}): DbWishlistItem {
  return {
    id: row.id,
    productId: row.product_id,
    addedAt: row.added_at,
  };
}

// ── service functions ─────────────────────────────────────────────────────────

export async function getWishlistService(
  userId: string,
): Promise<DbWishlistItem[]> {
  const rows = await db.orm.public.wishlist_items
    .where({ user_id: userId })
    .orderBy((w) => w.id.asc())
    .all();
  return rows.map(rowToDbWishlistItem);
}

export async function addWishlistItemService(
  userId: string,
  payload: AddWishlistItemPayload,
): Promise<DbWishlistItem> {
  // No DB-level FK — enforced here, service-layer, per project convention.
  const product = await db.orm.public.products
    .select("id")
    .where({ id: payload.productId, is_published: true })
    .first();
  if (!product) throw createHttpError(404, "Product not found.");

  const existing = await db.orm.public.wishlist_items
    .select("id", "product_id", "added_at")
    .where({ user_id: userId, product_id: payload.productId })
    .first();

  // Idempotent — return existing row if already wishlisted.
  if (existing) return rowToDbWishlistItem(existing);

  const row = await db.orm.public.wishlist_items.create({
    id: uuidv7(),
    user_id: userId,
    product_id: payload.productId,
    added_at: nowUtc() as any,
  });
  return rowToDbWishlistItem(row);
}

export async function removeWishlistItemService(
  userId: string,
  productId: string,
): Promise<void> {
  await db.orm.public.wishlist_items
    .where({ user_id: userId, product_id: productId })
    .delete();
}

export async function clearWishlistService(userId: string): Promise<void> {
  await db.orm.public.wishlist_items
    .where({ user_id: userId })
    .deleteAndCount();
}

// Upserts every guest wishlist item and returns the full merged wishlist.
export async function mergeWishlistService(
  userId: string,
  payload: MergeWishlistPayload,
): Promise<DbWishlistItem[]> {
  for (const item of payload.items) {
    await addWishlistItemService(userId, item);
  }
  return getWishlistService(userId);
}

import type { CreateReviewPayload, StoreReview } from "@ecommerce/contracts";
import { db } from "../prisma/db.js";
import { nowUtc } from "../utils/datetime.util.js";
import { uuidv7 } from "../utils/uuid.util.js";
import { createHttpError } from "../utils/response.util.js";

type ReviewRow = {
  id: string;
  user_id: string;
  order_id: string;
  rating: number;
  comment: string;
  created_at: string;
};

type ReviewMediaRow = {
  id: string;
  review_id: string;
  type: string;
  url: string;
};

function rowToReview(
  row: ReviewRow,
  media: ReviewMediaRow[],
  reviewerName: string,
): StoreReview {
  return {
    id: row.id,
    userId: row.user_id,
    orderId: row.order_id,
    reviewerName,
    rating: row.rating,
    comment: row.comment,
    media: media.map((m) => ({
      type: m.type === "video" ? "video" : "image",
      url: m.url,
    })),
    createdAt: row.created_at,
  };
}

export async function listStoreReviewsService(): Promise<StoreReview[]> {
  const rows = await db.orm.public.store_reviews
    .orderBy((r) => r.created_at.desc())
    .all();
  if (rows.length === 0) return [];

  const [media, users] = await Promise.all([
    db.orm.public.review_media
      .where((m) => m.review_id.in(rows.map((r) => r.id)))
      .all(),
    db.orm.public.users
      .select("id", "first_name", "last_name")
      .where((u) => u.id.in(rows.map((r) => r.user_id)))
      .all(),
  ]);
  const nameByUser = new Map(
    users.map((u) => [u.id, `${u.first_name} ${u.last_name}`]),
  );

  return rows.map((row) =>
    rowToReview(
      row,
      media.filter((m) => m.review_id === row.id),
      nameByUser.get(row.user_id) ?? "Verified Buyer",
    ),
  );
}

// Reviews are gated behind a purchased, delivered order — one review per
// order regardless of how many products it contains (thrift stock is
// one-off, so there's no per-product page to re-review).
export async function createReviewService(
  userId: string,
  payload: CreateReviewPayload,
): Promise<StoreReview> {
  const order = await db.orm.public.orders
    .select("id", "user_id", "status")
    .where({ id: payload.orderId })
    .first();
  if (!order || order.user_id !== userId) {
    throw createHttpError(403, "This order does not belong to you.");
  }
  if (order.status !== "delivered") {
    throw createHttpError(
      400,
      "You can only review products from delivered orders.",
    );
  }

  const existing = await db.orm.public.store_reviews
    .select("id")
    .where({ user_id: userId, order_id: payload.orderId })
    .first();
  if (existing) {
    throw createHttpError(409, "You already reviewed this order.");
  }

  const id = uuidv7();
  const row = await db.orm.public.store_reviews.create({
    id,
    user_id: userId,
    order_id: payload.orderId,
    rating: payload.rating,
    comment: payload.comment,
    created_at: nowUtc() as any,
  });

  // Only attach media the caller actually uploaded themselves (checked
  // against review_media_uploads) — otherwise a URL could be guessed/reused
  // from someone else's upload.
  const requestedMedia = payload.media ?? [];
  const owned =
    requestedMedia.length === 0
      ? []
      : await db.orm.public.review_media_uploads
          .select("url")
          .where({ user_id: userId })
          .where((r) => r.url.in(requestedMedia.map((m) => m.url)))
          .all();
  const ownedUrls = new Set(owned.map((r) => r.url));
  const media = requestedMedia.filter((m) => ownedUrls.has(m.url));

  for (const m of media) {
    await db.orm.public.review_media.create({
      id: uuidv7(),
      review_id: id,
      type: m.type,
      url: m.url,
    });
  }
  if (media.length > 0) {
    await db.orm.public.review_media_uploads
      .where((r) => r.url.in(media.map((m) => m.url)))
      .deleteAndCount();
  }

  const user = await db.orm.public.users
    .select("first_name", "last_name")
    .where({ id: userId })
    .first();

  return rowToReview(
    row,
    media.map((m) => ({ id: "", review_id: id, type: m.type, url: m.url })),
    user ? `${user.first_name} ${user.last_name}` : "Verified Buyer",
  );
}

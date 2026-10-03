import type { MediaCategory } from "@ecommerce/contracts";
import {
  compressImage,
  assertRealFileType,
  ALLOWED_VIDEO_MIME_TYPES,
} from "../utils/file-upload.util.js";
import {
  uploadImageBuffer,
  buildFolder,
  publicIdFromUrl,
  moveToRecycleBin,
  moveToRecycleBinByUrl,
  type UploadedImage,
} from "../utils/cloudinary.util.js";
import { db } from "../prisma/db.js";
import { nowUtc } from "../utils/datetime.util.js";
import { uuidv7 } from "../utils/uuid.util.js";
import { createHttpError } from "../utils/response.util.js";

export async function uploadMediaService(
  fileBuffer: Buffer,
  category: MediaCategory,
): Promise<UploadedImage> {
  const compressed = await compressImage(fileBuffer);
  return uploadImageBuffer(compressed, category);
}

// Videos skip compression (sharp can't touch them) but their real content
// type is checked via magic bytes (assertRealFileType) before upload.
// Cloudinary re-validates/transcodes on top of that.
export async function uploadVideoService(
  fileBuffer: Buffer,
  category: MediaCategory,
): Promise<UploadedImage> {
  await assertRealFileType(fileBuffer, ALLOWED_VIDEO_MIME_TYPES);
  return uploadImageBuffer(fileBuffer, category, "video");
}

// Records who uploaded a review attachment before it's attached to a review
// — this is what lets deleteReviewMediaService enforce ownership instead of
// trusting any signed-in caller with any review-folder URL.
export async function recordReviewMediaUploadService(
  userId: string,
  url: string,
): Promise<void> {
  await db.orm.public.review_media_uploads.create({
    id: uuidv7(),
    user_id: userId,
    url,
    created_at: nowUtc() as any,
  });
}

// Only ever recycles assets under the "review" Cloudinary folder, and only if
// the caller is the one who uploaded it (review_media_uploads) — a caller
// can't pass an arbitrary product/blog/home-hero URL, or someone else's
// review upload, and have it recycled.
export async function deleteReviewMediaService(
  userId: string,
  url: string,
): Promise<void> {
  const publicId = publicIdFromUrl(url);
  const reviewFolder = buildFolder("review");
  if (!publicId || !publicId.startsWith(`${reviewFolder}/`)) {
    throw createHttpError(400, "Not a review media URL.");
  }

  const upload = await db.orm.public.review_media_uploads
    .select("id", "user_id")
    .where({ url })
    .first();
  if (!upload || upload.user_id !== userId) {
    throw createHttpError(403, "You cannot delete this file.");
  }

  const resourceType = /\.(mp4|webm|mov)$/i.test(url) ? "video" : "image";
  await moveToRecycleBin(publicId, resourceType);
  await db.orm.public.review_media_uploads.where({ url }).delete();
}

const STALE_UPLOAD_AGE_MS = 24 * 60 * 60 * 1000;

// A row here means "uploaded but never attached to a review" — createReviewService
// deletes the row the moment a URL is attached (see review.service.ts), so anything
// still present past the TTL was abandoned (user navigated away/closed the tab).
// Called on a timer from index.ts; never invoked from a request handler.
export async function cleanupStaleReviewMediaUploadsService(): Promise<void> {
  const rows = await db.orm.public.review_media_uploads
    .select("url", "created_at")
    .all();
  const cutoff = Date.now() - STALE_UPLOAD_AGE_MS;
  const stale = rows.filter((r) => new Date(r.created_at).getTime() < cutoff);
  if (stale.length === 0) return;

  for (const row of stale) {
    const resourceType = /\.(mp4|webm|mov)$/i.test(row.url) ? "video" : "image";
    await moveToRecycleBinByUrl(row.url, resourceType);
  }
  await db.orm.public.review_media_uploads
    .where((r) => r.url.in(stale.map((s) => s.url)))
    .deleteAndCount();
}

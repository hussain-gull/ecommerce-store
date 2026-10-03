import type { Request, Response, NextFunction } from "express";
import { mediaUploadSchema, deleteMediaSchema } from "@ecommerce/contracts";
import { sendSuccess, sendError } from "../utils/response.util.js";
import { zodErrors } from "../utils/zod-errors.util.js";
import {
  uploadMediaService,
  uploadVideoService,
  deleteReviewMediaService,
  recordReviewMediaUploadService,
} from "../services/media.service.js";

export async function uploadMedia(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.file) {
    sendError(res, 400, "No file uploaded.");
    return;
  }

  const parsed = mediaUploadSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }

  try {
    const isVideo = req.file.mimetype.startsWith("video/");
    const uploaded = isVideo
      ? await uploadVideoService(req.file.buffer, parsed.data.category)
      : await uploadMediaService(req.file.buffer, parsed.data.category);
    sendSuccess(res, 201, isVideo ? "Video uploaded." : "Image uploaded.", [
      uploaded,
    ]);
  } catch (err) {
    next(err);
  }
}

// Customer-facing upload for review attachments — category is hardcoded to
// "review" (never taken from the request body) so a signed-in shopper can't
// write into any other Cloudinary folder.
export async function uploadReviewMedia(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.file) {
    sendError(res, 400, "No file uploaded.");
    return;
  }
  try {
    const isVideo = req.file.mimetype.startsWith("video/");
    const uploaded = isVideo
      ? await uploadVideoService(req.file.buffer, "review")
      : await uploadMediaService(req.file.buffer, "review");
    await recordReviewMediaUploadService(req.user!.sub, uploaded.url);
    sendSuccess(res, 201, isVideo ? "Video uploaded." : "Image uploaded.", [
      uploaded,
    ]);
  } catch (err) {
    next(err);
  }
}

// Customer-facing upload for the JazzCash payment screenshot — category is
// hardcoded to "payment", images only (the route uses the image uploader).
export async function uploadPaymentProof(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.file) {
    sendError(res, 400, "No file uploaded.");
    return;
  }
  try {
    const uploaded = await uploadMediaService(req.file.buffer, "payment");
    await recordReviewMediaUploadService(req.user!.sub, uploaded.url);
    sendSuccess(res, 201, "Screenshot uploaded.", [uploaded]);
  } catch (err) {
    next(err);
  }
}

export async function deleteReviewMedia(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = deleteMediaSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }
  try {
    await deleteReviewMediaService(req.user!.sub, parsed.data.url);
    sendSuccess(res, 200, "Media deleted.", []);
  } catch (err) {
    next(err);
  }
}

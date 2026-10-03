import type { Request, Response, NextFunction } from "express";
import { createReviewSchema } from "@ecommerce/contracts";
import { sendSuccess, sendError } from "../utils/response.util.js";
import { zodErrors } from "../utils/zod-errors.util.js";
import {
  listStoreReviewsService,
  createReviewService,
} from "../services/review.service.js";

export async function listStoreReviews(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const reviews = await listStoreReviewsService();
    sendSuccess(res, 200, "Reviews retrieved.", reviews);
  } catch (err) {
    next(err);
  }
}

export async function createReview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }
  try {
    const userId = req.user!.sub;
    const review = await createReviewService(userId, parsed.data);
    sendSuccess(res, 201, "Review submitted.", [review]);
  } catch (err) {
    next(err);
  }
}

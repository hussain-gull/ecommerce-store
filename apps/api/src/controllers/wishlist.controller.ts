import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "../utils/response.util.js";
import { zodErrors } from "../utils/zod-errors.util.js";
import {
  addWishlistItemSchema,
  mergeWishlistSchema,
} from "@ecommerce/contracts";
import {
  getWishlistService,
  addWishlistItemService,
  removeWishlistItemService,
  clearWishlistService,
  mergeWishlistService,
} from "../services/wishlist.service.js";

export async function getWishlist(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const items = await getWishlistService(req.user!.sub);
    sendSuccess(res, 200, "Wishlist retrieved.", items);
  } catch (err) {
    next(err);
  }
}

export async function addWishlistItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = addWishlistItemSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }
  try {
    const item = await addWishlistItemService(req.user!.sub, parsed.data);
    sendSuccess(res, 201, "Item added to wishlist.", [item]);
  } catch (err) {
    next(err);
  }
}

export async function removeWishlistItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const productId = req.params["productId"] as string | undefined;
  if (!productId) {
    sendError(res, 400, "Invalid product id.");
    return;
  }
  try {
    await removeWishlistItemService(req.user!.sub, productId);
    sendSuccess(res, 200, "Item removed from wishlist.", []);
  } catch (err) {
    next(err);
  }
}

export async function clearWishlist(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await clearWishlistService(req.user!.sub);
    sendSuccess(res, 200, "Wishlist cleared.", []);
  } catch (err) {
    next(err);
  }
}

export async function mergeWishlist(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = mergeWishlistSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }
  try {
    const items = await mergeWishlistService(req.user!.sub, parsed.data);
    sendSuccess(res, 200, "Wishlist merged.", items);
  } catch (err) {
    next(err);
  }
}

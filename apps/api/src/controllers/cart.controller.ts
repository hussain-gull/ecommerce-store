import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "../utils/response.util.js";
import { zodErrors } from "../utils/zod-errors.util.js";
import { addCartItemSchema, mergeCartSchema } from "@ecommerce/contracts";
import {
  getCartService,
  addCartItemService,
  removeCartItemService,
  clearCartService,
  mergeCartService,
} from "../services/cart.service.js";

export async function getCart(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const items = await getCartService(req.user!.sub);
    sendSuccess(res, 200, "Cart retrieved.", items);
  } catch (err) {
    next(err);
  }
}

export async function addCartItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = addCartItemSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }
  try {
    const item = await addCartItemService(req.user!.sub, parsed.data);
    sendSuccess(res, 201, "Item added to cart.", [item]);
  } catch (err) {
    next(err);
  }
}

export async function removeCartItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const productId = req.params["productId"] as string | undefined;
  if (!productId) {
    sendError(res, 400, "Invalid product id.");
    return;
  }
  const size =
    typeof req.query["size"] === "string" ? req.query["size"] : undefined;
  const color =
    typeof req.query["color"] === "string" ? req.query["color"] : undefined;
  try {
    await removeCartItemService(req.user!.sub, productId, size, color);
    sendSuccess(res, 200, "Item removed from cart.", []);
  } catch (err) {
    next(err);
  }
}

export async function clearCart(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await clearCartService(req.user!.sub);
    sendSuccess(res, 200, "Cart cleared.", []);
  } catch (err) {
    next(err);
  }
}

export async function mergeCart(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = mergeCartSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }
  try {
    const items = await mergeCartService(req.user!.sub, parsed.data);
    sendSuccess(res, 200, "Cart merged.", items);
  } catch (err) {
    next(err);
  }
}

import type { Request, Response, NextFunction } from "express";
import {
  adminOrdersQuerySchema,
  placeOrderSchema,
  updateOrderStatusSchema,
} from "@ecommerce/contracts";
import { sendSuccess, sendError } from "../utils/response.util.js";
import { zodErrors } from "../utils/zod-errors.util.js";
import {
  placeOrderService,
  adminOrderCountsService,
  listAdminOrdersService,
  listMyOrdersService,
  confirmOrderService,
  cancelOrderService,
  updateOrderStatusService,
} from "../services/order.service.js";

export async function placeOrder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = placeOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }
  try {
    const order = await placeOrderService(req.user!.sub, parsed.data);
    sendSuccess(res, 201, "Order placed.", [order]);
  } catch (err) {
    next(err);
  }
}

export async function listMyOrders(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(
      res,
      200,
      "Orders fetched.",
      await listMyOrdersService(req.user!.sub),
    );
  } catch (err) {
    next(err);
  }
}

export async function listAdminOrders(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = adminOrdersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendError(res, 422, "Invalid orders query.", zodErrors(parsed.error));
    return;
  }
  try {
    const { orders, meta } = await listAdminOrdersService(parsed.data);
    sendSuccess(res, 200, "Orders fetched.", orders, meta);
  } catch (err) {
    next(err);
  }
}

export async function adminOrderCounts(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    sendSuccess(res, 200, "Order counts.", [await adminOrderCountsService()]);
  } catch (err) {
    next(err);
  }
}

export async function confirmOrder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await confirmOrderService(req.params["id"] as string);
    sendSuccess(res, 200, "Order confirmed.", []);
  } catch (err) {
    next(err);
  }
}

export async function cancelOrder(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await cancelOrderService(req.params["id"] as string);
    sendSuccess(res, 200, "Order cancelled.", []);
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = updateOrderStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }
  try {
    await updateOrderStatusService(
      req.params["id"] as string,
      parsed.data.status,
    );
    sendSuccess(res, 200, `Order marked ${parsed.data.status}.`, []);
  } catch (err) {
    next(err);
  }
}

import { Router } from "express";
import { orderLimiter } from "../middleware/rate-limit.middleware.js";
import {
  authenticate,
  authenticateAdmin,
} from "../middleware/auth.middleware.js";
import {
  placeOrder,
  adminOrderCounts,
  listAdminOrders,
  listMyOrders,
  confirmOrder,
  cancelOrder,
  updateOrderStatus,
} from "../controllers/order.controller.js";

export const orderRouter = Router();

// Customer — place an order from the signed-in user's cart.
orderRouter.post("/", authenticate, orderLimiter, placeOrder);
// Customer — their own order history.
orderRouter.get("/mine", authenticate, listMyOrders);

// Admin — review payment proof, then confirm or reject.
orderRouter.get("/admin", authenticateAdmin, listAdminOrders);
orderRouter.get("/admin/counts", authenticateAdmin, adminOrderCounts);
orderRouter.patch("/admin/:id/confirm", authenticateAdmin, confirmOrder);
orderRouter.patch("/admin/:id/cancel", authenticateAdmin, cancelOrder);
orderRouter.patch("/admin/:id/status", authenticateAdmin, updateOrderStatus);

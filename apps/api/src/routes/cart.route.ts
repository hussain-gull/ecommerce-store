import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getCart,
  addCartItem,
  removeCartItem,
  clearCart,
  mergeCart,
} from "../controllers/cart.controller.js";

export const cartRouter = Router();

cartRouter.use(authenticate);

cartRouter.get("/", getCart);
cartRouter.post("/items", addCartItem);
cartRouter.delete("/items/:productId", removeCartItem);
cartRouter.delete("/", clearCart);
cartRouter.post("/merge", mergeCart);

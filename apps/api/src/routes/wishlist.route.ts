import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
  clearWishlist,
  mergeWishlist,
} from "../controllers/wishlist.controller.js";

export const wishlistRouter = Router();

wishlistRouter.use(authenticate);

wishlistRouter.get("/", getWishlist);
wishlistRouter.post("/items", addWishlistItem);
wishlistRouter.delete("/items/:productId", removeWishlistItem);
wishlistRouter.delete("/", clearWishlist);
wishlistRouter.post("/merge", mergeWishlist);

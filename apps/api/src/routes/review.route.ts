import { Router } from "express";
import {
  listStoreReviews,
  createReview,
} from "../controllers/review.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

export const reviewRouter = Router();

// Public — anyone can read the store's reviews.
reviewRouter.get("/", listStoreReviews);

// Customer-only — verified-purchase gate is enforced in the service layer.
reviewRouter.post("/", authenticate, createReview);

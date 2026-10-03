import { Router } from "express";
import {
  sendContactMessage,
  contactMessageCounts,
  listContactMessages,
  markContactMessageRead,
} from "../controllers/contact.controller.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";
import { contactLimiter } from "../middleware/rate-limit.middleware.js";

export const contactRouter = Router();

// Public — the storefront submits messages unauthenticated.
contactRouter.post("/", contactLimiter, sendContactMessage);

// Admin-only — viewing the inbox requires an admin session.
contactRouter.get("/", authenticateAdmin, listContactMessages);
contactRouter.get("/counts", authenticateAdmin, contactMessageCounts);
contactRouter.patch("/:id/read", authenticateAdmin, markContactMessageRead);

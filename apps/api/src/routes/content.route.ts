import { Router } from "express";
import {
  getHomeContent,
  updateHomeContent,
  getAboutContent,
  updateAboutContent,
  getContactContent,
  updateContactContent,
  getBlogContent,
  updateBlogContent,
  getConditionGuideContent,
  updateConditionGuideContent,
  getPaymentContent,
  updatePaymentContent,
} from "../controllers/content.controller.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";

export const contentRouter = Router();

// Public — the storefront reads content unauthenticated.
contentRouter.get("/home", getHomeContent);
contentRouter.get("/about", getAboutContent);
contentRouter.get("/contact", getContactContent);
contentRouter.get("/blog", getBlogContent);
contentRouter.get("/condition-guide", getConditionGuideContent);
contentRouter.get("/payment", getPaymentContent);

// Admin-only — editing content requires an admin session.
contentRouter.put("/home", authenticateAdmin, updateHomeContent);
contentRouter.put("/about", authenticateAdmin, updateAboutContent);
contentRouter.put("/contact", authenticateAdmin, updateContactContent);
contentRouter.put("/blog", authenticateAdmin, updateBlogContent);
contentRouter.put(
  "/condition-guide",
  authenticateAdmin,
  updateConditionGuideContent,
);
contentRouter.put("/payment", authenticateAdmin, updatePaymentContent);

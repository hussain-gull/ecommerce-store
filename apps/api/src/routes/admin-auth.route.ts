import { Router } from "express";
import {
  adminLogin,
  adminRefreshToken,
  adminLogout,
} from "../controllers/admin-auth.controller.js";
import { authenticateAdmin } from "../middleware/auth.middleware.js";

import {
  authLimiter,
  refreshLimiter,
  loginAccountLimiter,
} from "../middleware/rate-limit.middleware.js";

export const adminAuthRouter = Router();

adminAuthRouter.post("/login", authLimiter, loginAccountLimiter, adminLogin);
adminAuthRouter.post("/refresh", refreshLimiter, adminRefreshToken);

// Logout is protected — must present a valid admin access token to prevent CSRF-style logouts
adminAuthRouter.post("/logout", authenticateAdmin, adminLogout);

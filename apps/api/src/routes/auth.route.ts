import { Router } from "express";
import {
  authSignup,
  authLogin,
  authRefreshToken,
  authLogout,
  authForgotPassword,
  authResetPassword,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  authLimiter,
  refreshLimiter,
  loginAccountLimiter,
} from "../middleware/rate-limit.middleware.js";

export const authRouter = Router();

authRouter.post("/register", authLimiter, authSignup);
authRouter.post("/login", authLimiter, loginAccountLimiter, authLogin);
authRouter.post("/refresh", refreshLimiter, authRefreshToken);

// Logout is protected — user must present a valid access token to prevent CSRF-style logouts
authRouter.post("/logout", authenticate, authLogout);

// Password reset — both endpoints are public (unauthenticated)
authRouter.post("/forgot-password", authLimiter, authForgotPassword);
authRouter.post("/reset-password", authLimiter, authResetPassword);

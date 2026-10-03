import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "../utils/response.util.js";
import {
  adminLoginService,
  adminRefreshTokenService,
  adminLogoutService,
} from "../services/admin-auth.service.js";
import { zodErrors } from "../utils/zod-errors.util.js";
import { loginSchema } from "@ecommerce/contracts";
import { config } from "../config.js";

// ─── Cookie helpers ───────────────────────────────────────────────────────────

function setAdminRefreshCookie(res: Response, token: string): void {
  res.cookie(config.adminRefreshCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    // Scope cookie only to the admin refresh endpoint so it never leaks to other routes
    path: "/api/v1/admin/auth/refresh",
    maxAge: config.adminRefreshCookieTtlMs,
  });
}

function clearAdminRefreshCookie(res: Response): void {
  res.clearCookie(config.adminRefreshCookieName, {
    path: "/api/v1/admin/auth/refresh",
  });
}

// ─── Controllers ──────────────────────────────────────────────────────────────

export async function adminLogin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }

  try {
    const { user, tokens } = await adminLoginService(parsed.data);
    setAdminRefreshCookie(res, tokens.refreshToken);
    sendSuccess(res, 200, "Logged in successfully.", [
      { user, accessToken: tokens.accessToken },
    ]);
  } catch (err) {
    next(err);
  }
}

export async function adminRefreshToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const refreshToken = req.cookies?.[config.adminRefreshCookieName] as
    string | undefined;

  if (!refreshToken) {
    sendError(res, 401, "Refresh token is missing.");
    return;
  }

  try {
    const { accessToken, newRefreshToken } =
      await adminRefreshTokenService(refreshToken);
    setAdminRefreshCookie(res, newRefreshToken);
    sendSuccess(res, 200, "Token refreshed successfully.", [{ accessToken }]);
  } catch (err) {
    clearAdminRefreshCookie(res);
    next(err);
  }
}

export async function adminLogout(req: Request, res: Response): Promise<void> {
  await adminLogoutService(req.user!.sub);
  clearAdminRefreshCookie(res);
  sendSuccess(res, 200, "Logged out successfully.", []);
}

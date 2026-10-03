import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "../utils/response.util.js";
import {
  signupService,
  loginService,
  refreshTokenService,
  logoutService,
  forgotPasswordService,
  resetPasswordService,
} from "../services/auth.service.js";
import { zodErrors } from "../utils/zod-errors.util.js";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@ecommerce/contracts";
import { config } from "../config.js";

// ─── Cookie helpers ───────────────────────────────────────────────────────────

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(config.refreshCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    // Scope cookie only to the refresh endpoint so it never leaks to other routes
    path: "/api/v1/auth/refresh",
    maxAge: config.refreshCookieTtlMs,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(config.refreshCookieName, { path: "/api/v1/auth/refresh" });
}

// ─── Controllers ──────────────────────────────────────────────────────────────

export async function authSignup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }

  try {
    const { user, tokens } = await signupService(parsed.data);
    setRefreshCookie(res, tokens.refreshToken);
    sendSuccess(res, 201, "Account created successfully.", [
      { user, accessToken: tokens.accessToken },
    ]);
  } catch (err) {
    next(err);
  }
}

export async function authLogin(
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
    const { user, tokens } = await loginService(parsed.data);
    setRefreshCookie(res, tokens.refreshToken);
    sendSuccess(res, 200, "Logged in successfully.", [
      { user, accessToken: tokens.accessToken },
    ]);
  } catch (err) {
    next(err);
  }
}

export async function authRefreshToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const refreshToken = req.cookies?.[config.refreshCookieName] as
    string | undefined;

  if (!refreshToken) {
    sendError(res, 401, "Refresh token is missing.");
    return;
  }

  try {
    const { accessToken, newRefreshToken } =
      await refreshTokenService(refreshToken);
    setRefreshCookie(res, newRefreshToken);
    sendSuccess(res, 200, "Token refreshed successfully.", [{ accessToken }]);
  } catch (err) {
    // On any refresh failure, clear the stale cookie before forwarding the error
    clearRefreshCookie(res);
    next(err);
  }
}

export async function authLogout(req: Request, res: Response): Promise<void> {
  await logoutService(req.user!.sub);
  clearRefreshCookie(res);
  sendSuccess(res, 200, "Logged out successfully.", []);
}

export async function authForgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }

  try {
    // Service never throws based on email existence — prevents enumeration.
    await forgotPasswordService(parsed.data);
    sendSuccess(
      res,
      200,
      "If that email is registered, a reset link has been sent.",
      [],
    );
  } catch (err) {
    next(err);
  }
}

export async function authResetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
    return;
  }

  try {
    await resetPasswordService(parsed.data);
    sendSuccess(
      res,
      200,
      "Password updated successfully. You can now sign in with your new password.",
      [],
    );
  } catch (err) {
    next(err);
  }
}

import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "../types/jwt.js";
import { sendError } from "../utils/response.util.js";
import { config } from "../config.js";

/**
 * Verifies the Bearer access token from the Authorization header.
 * On success, populates req.user with the decoded JWT payload.
 * On failure, responds 401 — never calls next(err) so the global handler is bypassed.
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    sendError(res, 401, "Access token is missing.");
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    sendError(res, 500, "Server configuration error.");
    return;
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    }) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    const isExpired = err instanceof jwt.TokenExpiredError;
    sendError(
      res,
      401,
      isExpired ? "Access token has expired." : "Invalid access token.",
    );
  }
}

/**
 * Verifies the Bearer access token against the admin JWT secret and requires
 * role === "admin". Kept fully separate from `authenticate` so a customer
 * token can never satisfy an admin-only route, and vice versa.
 */
export function authenticateAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    sendError(res, 401, "Access token is missing.");
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, config.adminJwtSecret, {
      algorithms: ["HS256"],
    }) as JwtPayload;
    if (decoded.role !== "admin") {
      sendError(res, 403, "Admin access required.");
      return;
    }
    req.user = decoded;
    next();
  } catch (err) {
    const isExpired = err instanceof jwt.TokenExpiredError;
    sendError(
      res,
      401,
      isExpired ? "Access token has expired." : "Invalid access token.",
    );
  }
}

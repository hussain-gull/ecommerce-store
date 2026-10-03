import { rateLimit } from "express-rate-limit";
import type { Request, Response } from "express";
import { config } from "../config.js";
import { sendError } from "../utils/response.util.js";

// ponytail: in-memory counters — per API instance, so N instances allow N× the
// limit. Swap in a shared store (rate-limit-redis over the existing ioredis
// client) if the API is ever scaled out.
function limiter(
  windowMs: number,
  limit: number,
  message: string,
  keyGenerator?: (req: Request) => string,
) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: () => config.rateLimitDisabled,
    ...(keyGenerator && {
      keyGenerator,
      validate: { keyGeneratorIpFallback: false },
    }),
    handler: (_req: Request, res: Response) => {
      sendError(res, 429, message);
    },
  });
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/** Baseline for every route — stops crude floods, generous for real browsing. */
export const globalLimiter = limiter(
  MINUTE,
  300,
  "Too many requests. Please slow down.",
);

/** Login / register / password recovery — brute force and account-spam target. */
export const authLimiter = limiter(
  15 * MINUTE,
  20,
  "Too many attempts. Please try again in a few minutes.",
);

/** Customer file uploads (each one hits Cloudinary + sharp). */
export const uploadLimiter = limiter(
  HOUR,
  40,
  "Too many uploads. Please try again later.",
);

/** Placing orders — a real shopper needs a handful, never dozens. */
export const orderLimiter = limiter(
  10 * MINUTE,
  10,
  "Too many order attempts. Please wait a few minutes.",
);

/** Public contact form — classic spam vector. */
export const contactLimiter = limiter(
  HOUR,
  10,
  "Too many messages. Please try again later.",
);

/** Token refresh — cheap but a stolen-cookie / flood target. */
export const refreshLimiter = limiter(
  15 * MINUTE,
  60,
  "Too many refresh attempts. Please try again later.",
);

/** Per-account login lockout: stops a distributed brute force on one email. */
export const loginAccountLimiter = limiter(
  15 * MINUTE,
  10,
  "Too many attempts for this account. Please try again in a few minutes.",
  (req) => `acct:${String(req.body?.email ?? "").toLowerCase()}`,
);

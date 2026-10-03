// Central runtime configuration — every tunable value lives here.
// All fields have safe defaults so the server boots in development without a full .env.
// JWT_SECRET has no default and throws at first use if missing (caught at startup).

import { branding } from "@ecommerce/contracts";

function intEnv(key: string, defaultVal: number): number {
  const raw = process.env[key];
  if (raw === undefined) return defaultVal;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Config: ${key} must be a positive integer (got "${raw}")`);
  }
  return parsed;
}

function strEnv(key: string, defaultVal: string): string {
  return process.env[key] ?? defaultVal;
}

export const config = {
  // ── JWT ──────────────────────────────────────────────────────────────────────
  // jwtSecret is a lazy getter — throws only when first called, not at import time.
  get jwtSecret(): string {
    const s = process.env.JWT_SECRET;
    if (!s) throw new Error("JWT_SECRET is not configured");
    return s;
  },
  jwtAccessTtl: strEnv("JWT_ACCESS_TTL", "15m"),
  jwtRefreshTtl: strEnv("JWT_REFRESH_TTL", "7d"),

  // ── bcrypt ───────────────────────────────────────────────────────────────────
  bcryptSaltRounds: intEnv("BCRYPT_SALT_ROUNDS", 12),

  // ── Refresh cookie ───────────────────────────────────────────────────────────
  refreshCookieName: strEnv("REFRESH_COOKIE_NAME", "refresh_token"),
  // Cookie maxAge is derived from REFRESH_COOKIE_TTL_DAYS so it stays in sync with JWT_REFRESH_TTL.
  get refreshCookieTtlMs(): number {
    return intEnv("REFRESH_COOKIE_TTL_DAYS", 7) * 24 * 60 * 60 * 1000;
  },

  // ── Password reset ───────────────────────────────────────────────────────────
  get resetTokenTtlMs(): number {
    return intEnv("RESET_TOKEN_TTL_MINUTES", 60) * 60 * 1000;
  },

  // ── Rate limiting / proxy ─────────────────────────────────────────────────
  // Number of reverse-proxy hops in front of the API (0 = none). MUST be set
  // correctly in production, otherwise every client shares the proxy's IP and
  // rate limits either never fire or lock everyone out together.
  trustProxyHops: Number(strEnv("TRUST_PROXY_HOPS", "0")) || 0,
  // Escape hatch for tests/local load runs only.
  rateLimitDisabled: strEnv("RATE_LIMIT_DISABLED", "") === "true",

  // ── App URLs ─────────────────────────────────────────────────────────────────
  frontendUrl: strEnv("FRONTEND_URL", "http://localhost:3000"),
  // Exact-match CORS allowlist (comma-separated). Never "*": credentials are on.
  get corsOrigins(): string[] {
    return strEnv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
  },

  // ── Email (Resend) ────────────────────────────────────────────────────────
  // Leave empty in development — email.util.ts falls back to stdout logging.
  resendApiKey: strEnv("RESEND_API_KEY", ""),
  emailFrom: strEnv(
    "EMAIL_FROM",
    `"${branding.storeName}" <noreply@example.com>`,
  ),
  // True only when the key looks like a real Resend key (re_...).
  // Placeholder values like "your-api-key" fall back to dev/stdout mode.
  get resendEnabled(): boolean {
    return /^re_[A-Za-z0-9_-]{10,}$/.test(this.resendApiKey);
  },

  // ── Cloudinary (media uploads) ────────────────────────────────────────────
  // Lazy getters — only throw when an upload is actually attempted, so the
  // server still boots without these configured.
  get cloudinaryCloudName(): string {
    const v = process.env.CLOUDINARY_CLOUD_NAME;
    if (!v) throw new Error("CLOUDINARY_CLOUD_NAME is not configured");
    return v;
  },
  get cloudinaryApiKey(): string {
    const v = process.env.CLOUDINARY_API_KEY;
    if (!v) throw new Error("CLOUDINARY_API_KEY is not configured");
    return v;
  },
  get cloudinaryApiSecret(): string {
    const v = process.env.CLOUDINARY_API_SECRET;
    if (!v) throw new Error("CLOUDINARY_API_SECRET is not configured");
    return v;
  },
  // Root folder all uploads are namespaced under, keeps environments/tenants apart.
  cloudinaryRootFolder: strEnv("CLOUDINARY_ROOT_FOLDER", "store"),

  // ── Admin JWT ────────────────────────────────────────────────────────────────
  // Deliberately separate from JWT_SECRET so a leaked customer secret can never
  // be used to forge an admin session, and vice versa.
  get adminJwtSecret(): string {
    const s = process.env.ADMIN_JWT_SECRET;
    if (!s) throw new Error("ADMIN_JWT_SECRET is not configured");
    return s;
  },
  adminJwtAccessTtl: strEnv("ADMIN_JWT_ACCESS_TTL", "15m"),
  adminJwtRefreshTtl: strEnv("ADMIN_JWT_REFRESH_TTL", "1d"),

  // ── Admin refresh cookie ─────────────────────────────────────────────────────
  adminRefreshCookieName: strEnv(
    "ADMIN_REFRESH_COOKIE_NAME",
    "admin_refresh_token",
  ),
  get adminRefreshCookieTtlMs(): number {
    return intEnv("ADMIN_REFRESH_COOKIE_TTL_DAYS", 1) * 24 * 60 * 60 * 1000;
  },

  // ── Redis (read-through cache) ────────────────────────────────────────────
  redisUrl: strEnv("REDIS_URL", "redis://localhost:6379"),
  cacheTtlSeconds: intEnv("CACHE_TTL_SECONDS", 300),
  // Long-lived entries (page content, payment details, filter options): rarely
  // edited and always invalidated on write, so the TTL is only a safety net.
  cacheLongTtlSeconds: intEnv("CACHE_LONG_TTL_SECONDS", 86400),
};

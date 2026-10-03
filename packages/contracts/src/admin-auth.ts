import type { AuthTokens } from "./auth";

// ─── Authenticated admin user (safe to send to client — no password) ──────────

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string; // ISO-8601 UTC
};

export type AdminAuthResponse = {
  user: AdminUser;
  tokens: AuthTokens;
};

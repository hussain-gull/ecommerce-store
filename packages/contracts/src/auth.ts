// ─── Auth payload types ───────────────────────────────────────────────────────

export type SignupPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

// ─── Authenticated user (safe to send to client — no password) ────────────────

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  createdAt: string; // ISO-8601 UTC
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = {
  user: AuthUser;
  tokens: AuthTokens;
};

// ─── Password reset payloads ──────────────────────────────────────────────────

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  password: string;
};

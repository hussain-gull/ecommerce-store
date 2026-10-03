import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import type {
  SignupPayload,
  LoginPayload,
  AuthResponse,
  AuthUser,
  AuthTokens,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from "@ecommerce/contracts";
import type { JwtPayload } from "../types/jwt.js";
import { db } from "../prisma/db.js";
import { nowUtc } from "../utils/datetime.util.js";
import { createHttpError } from "../utils/response.util.js";
import {
  isRefreshRevoked,
  revokeRefreshTokens,
} from "../utils/token-revocation.util.js";
import {
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "../utils/email.util.js";
import { config } from "../config.js";

// Compared against when the email is unknown so login timing does not reveal registered emails.
const DUMMY_HASH = bcrypt.hashSync("timing-equalizer", 12);

// ── private helpers ───────────────────────────────────────────────────────────

function signTokens(userId: string, email: string): AuthResponse["tokens"] {
  const accessToken = jwt.sign(
    { sub: userId, email } satisfies JwtPayload,
    config.jwtSecret,
    {
      expiresIn: config.jwtAccessTtl as any,
    },
  );
  const refreshToken = jwt.sign(
    { sub: userId } satisfies JwtPayload,
    config.jwtSecret,
    {
      expiresIn: config.jwtRefreshTtl as any,
    },
  );
  return { accessToken, refreshToken };
}

// Maps a snake_case ORM row to the camelCase AuthUser contract type.
// `password_hash` is intentionally excluded — never expose it to the client.
function rowToAuthUser(row: {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string | null;
  created_at: string;
}): AuthUser {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    ...(row.phone_number ? { phone: row.phone_number } : {}),
    createdAt: row.created_at,
  };
}

// ── service functions ─────────────────────────────────────────────────────────

export async function signupService(
  payload: SignupPayload,
): Promise<AuthResponse> {
  const { firstName, lastName, email, password, phone } = payload;

  const existing = await db.orm.public.users
    .select("id")
    .where({ email: email.toLowerCase() })
    .first();

  if (existing) {
    throw createHttpError(409, "Email is already registered.");
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds);

  const row = await db.orm.public.users.create({
    id: crypto.randomUUID(),
    first_name: firstName,
    last_name: lastName,
    email: email.toLowerCase(),
    password_hash: passwordHash,
    phone_number: phone,
    created_at: nowUtc() as any,
  });

  const user: AuthUser = rowToAuthUser(row);
  const tokens: AuthTokens = signTokens(user.id, user.email);

  // Fire-and-forget: don't fail the signup if the welcome email errors.
  sendWelcomeEmail({ to: user.email, firstName: user.firstName }).catch(
    (err: unknown) => {
      console.error("Welcome email failed:", err);
    },
  );

  return { user, tokens };
}

export async function loginService(
  payload: LoginPayload,
): Promise<AuthResponse> {
  const { email, password } = payload;

  const row = await db.orm.public.users
    .where({ email: email.toLowerCase() })
    .first();

  const passwordMatch = await bcrypt.compare(
    password,
    row?.password_hash ?? DUMMY_HASH,
  );
  if (!row || !passwordMatch) {
    throw createHttpError(401, "Invalid email or password.");
  }

  const user = rowToAuthUser(row);
  const tokens = signTokens(user.id, user.email);
  return { user, tokens };
}

// ── Password reset ────────────────────────────────────────────────────────────

export async function forgotPasswordService(
  payload: ForgotPasswordPayload,
): Promise<void> {
  const { email } = payload;

  const user = await db.orm.public.users
    .select("id", "email", "first_name")
    .where({ email: email.toLowerCase() })
    .first();

  // Always return without error — never reveal whether the email is registered.
  if (!user) return;

  // Purge any existing pending tokens for this user before issuing a new one.
  // This prevents token accumulation and ensures only the latest link is valid.
  await db.orm.public.password_reset_tokens
    .where({ user_id: user.id })
    .deleteAndCount();

  // Generate a 32-byte (256-bit) cryptographically random token.
  // Only the SHA-256 hash is persisted — the raw token travels exclusively in the email URL.
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  const expiresAt = new Date(Date.now() + config.resetTokenTtlMs);

  await db.orm.public.password_reset_tokens.create({
    id: crypto.randomUUID(),
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString() as any,
    created_at: nowUtc() as any,
  });

  const resetUrl = `${config.frontendUrl}/reset-password?token=${rawToken}`;

  await sendPasswordResetEmail({
    to: user.email,
    firstName: user.first_name,
    resetUrl,
    expiresAt,
  });
}

export async function resetPasswordService(
  payload: ResetPasswordPayload,
): Promise<void> {
  const { token, password } = payload;

  // Reject malformed tokens immediately — avoids an unnecessary DB round-trip.
  if (!/^[0-9a-f]{64}$/.test(token)) {
    throw createHttpError(
      400,
      "Invalid or expired reset link. Please request a new one.",
    );
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const record = await db.orm.public.password_reset_tokens
    .where({ token_hash: tokenHash })
    .first();

  if (!record) {
    throw createHttpError(
      400,
      "Invalid or expired reset link. Please request a new one.",
    );
  }

  // Single-use enforcement: reject tokens that have already been consumed.
  if (record.used_at) {
    throw createHttpError(
      400,
      "This reset link has already been used. Please request a new one.",
    );
  }

  // TTL enforcement: reject tokens past their expiry window.
  if (new Date(record.expires_at) < new Date()) {
    throw createHttpError(
      400,
      "This reset link has expired. Please request a new one.",
    );
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds);

  // Update the password and mark the token consumed in a sequential pair.
  // If the password update fails, the token stays unconsumed so the user can retry.
  await db.orm.public.users
    .where({ id: record.user_id })
    .update({ password_hash: passwordHash });

  await db.orm.public.password_reset_tokens
    .where({ token_hash: tokenHash })
    .update({ used_at: nowUtc() as any });

  // Force re-login everywhere: refresh tokens issued before now are rejected.
  await revokeRefreshTokens("user", record.user_id);
}

export async function logoutService(userId: string): Promise<void> {
  await revokeRefreshTokens("user", userId);
}

export async function refreshTokenService(
  refreshToken: string,
): Promise<{ accessToken: string; newRefreshToken: string }> {
  let payload: JwtPayload;
  try {
    payload = jwt.verify(refreshToken, config.jwtSecret, {
      algorithms: ["HS256"],
    }) as JwtPayload;
  } catch (err) {
    const isExpired = err instanceof jwt.TokenExpiredError;
    throw createHttpError(
      401,
      isExpired
        ? "Refresh token has expired. Please log in again."
        : "Invalid refresh token.",
    );
  }

  if (await isRefreshRevoked("user", payload.sub, payload.iat)) {
    throw createHttpError(401, "Invalid refresh token.");
  }

  // Fetch only the columns needed to re-issue tokens; avoids fetching password_hash.
  const row = await db.orm.public.users
    .select("id", "email")
    .where({ id: payload.sub })
    .first();

  if (!row) {
    throw createHttpError(401, "User no longer exists.");
  }

  const tokens = signTokens(row.id, row.email);
  return {
    accessToken: tokens.accessToken,
    newRefreshToken: tokens.refreshToken,
  };
}

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type {
  LoginPayload,
  AdminAuthResponse,
  AdminUser,
} from "@ecommerce/contracts";
import type { JwtPayload } from "../types/jwt.js";
import { db } from "../prisma/db.js";
import { createHttpError } from "../utils/response.util.js";
import { config } from "../config.js";
import {
  isRefreshRevoked,
  revokeRefreshTokens,
} from "../utils/token-revocation.util.js";

// Compared against when the email is unknown so login timing does not reveal registered emails.
const DUMMY_HASH = bcrypt.hashSync("timing-equalizer", 12);

function signAdminTokens(
  userId: string,
  email: string,
): AdminAuthResponse["tokens"] {
  const accessToken = jwt.sign(
    { sub: userId, email, role: "admin" } satisfies JwtPayload,
    config.adminJwtSecret,
    { expiresIn: config.adminJwtAccessTtl as any },
  );
  const refreshToken = jwt.sign(
    { sub: userId, role: "admin" } satisfies JwtPayload,
    config.adminJwtSecret,
    { expiresIn: config.adminJwtRefreshTtl as any },
  );
  return { accessToken, refreshToken };
}

function rowToAdminUser(row: {
  id: string;
  name: string;
  email: string;
  created_at: string;
}): AdminUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  };
}

export async function adminLoginService(
  payload: LoginPayload,
): Promise<AdminAuthResponse> {
  const { email, password } = payload;

  const row = await db.orm.public.admin_users
    .where({ email: email.toLowerCase() })
    .first();

  const passwordMatch = await bcrypt.compare(
    password,
    row?.password_hash ?? DUMMY_HASH,
  );
  if (!row || !passwordMatch) {
    throw createHttpError(401, "Invalid email or password.");
  }

  const user = rowToAdminUser(row);
  const tokens = signAdminTokens(user.id, user.email);
  return { user, tokens };
}

export async function adminRefreshTokenService(
  refreshToken: string,
): Promise<{ accessToken: string; newRefreshToken: string }> {
  let payload: JwtPayload;
  try {
    payload = jwt.verify(refreshToken, config.adminJwtSecret, {
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

  if (payload.role !== "admin") {
    throw createHttpError(401, "Invalid refresh token.");
  }

  if (await isRefreshRevoked("admin", payload.sub, payload.iat)) {
    throw createHttpError(401, "Invalid refresh token.");
  }

  const row = await db.orm.public.admin_users
    .select("id", "email")
    .where({ id: payload.sub })
    .first();

  if (!row) {
    throw createHttpError(401, "Admin user no longer exists.");
  }

  const tokens = signAdminTokens(row.id, row.email);
  return {
    accessToken: tokens.accessToken,
    newRefreshToken: tokens.refreshToken,
  };
}

export async function adminLogoutService(adminId: string): Promise<void> {
  await revokeRefreshTokens("admin", adminId);
}

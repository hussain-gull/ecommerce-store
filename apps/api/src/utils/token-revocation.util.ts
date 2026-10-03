import { cacheGet, cacheSet } from "./redis.util.js";

// Stateless refresh-token revocation: logout / password reset stamps a
// "revoked before" time per subject, and refresh rejects any token issued
// earlier. Needs no schema change. Fails open if Redis is down (see redis.util).
// TTL covers the longest refresh-token lifetime (7d).
const TTL_SECONDS = 8 * 24 * 60 * 60;
const key = (scope: "user" | "admin", sub: string) => `revoked:${scope}:${sub}`;

export async function revokeRefreshTokens(
  scope: "user" | "admin",
  sub: string,
): Promise<void> {
  await cacheSet(key(scope, sub), Math.floor(Date.now() / 1000), TTL_SECONDS);
}

/** True when the token was issued before the subject's last revocation. */
export async function isRefreshRevoked(
  scope: "user" | "admin",
  sub: string,
  iat: number | undefined,
): Promise<boolean> {
  const at = await cacheGet<number>(key(scope, sub));
  return at !== null && (iat ?? 0) <= at;
}

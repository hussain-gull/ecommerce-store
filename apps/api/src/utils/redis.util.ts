import Redis from "ioredis";
import { config } from "../config.js";

// Single lazy-connect client. Cache is an optimization, not a dependency —
// every helper below fails open (falls through to the DB) if Redis is down.
const client = new Redis(config.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null, // one attempt, then give up until the next call
});
client.on("error", (err) => console.error("[redis]", err.message));

async function ensureConnected(): Promise<boolean> {
  if (client.status === "ready") return true;
  if (client.status === "connecting" || client.status === "connect")
    return false;
  try {
    await client.connect();
    return true;
  } catch {
    return false;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!(await ensureConnected())) return null;
  try {
    const raw = await client.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number = config.cacheTtlSeconds,
): Promise<void> {
  if (!(await ensureConnected())) return;
  try {
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // fail open — a stale/missing cache entry just means the next read hits the DB
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  if (!(await ensureConnected())) return;
  try {
    await client.del(...keys);
  } catch {
    // ignore — worst case a stale entry serves until its TTL expires
  }
}

/** Atomically bumps a counter (used as a cache version); null if Redis is unreachable. */
export async function cacheIncr(key: string): Promise<number | null> {
  if (!(await ensureConnected())) return null;
  try {
    return await client.incr(key);
  } catch {
    return null;
  }
}

/** Current counter value (0 when unset); null if Redis is unreachable. */
export async function cacheCounter(key: string): Promise<number | null> {
  if (!(await ensureConnected())) return null;
  try {
    return Number((await client.get(key)) ?? 0);
  } catch {
    return null;
  }
}

import type { ApiErrorBody, ApiResponseBody } from "@ecommerce/contracts";
import type { ZodType } from "zod";
import { apiClient } from "./axios";

// Fetch semantics for pages (Server Components):
//   • "not there" is EXPECTED — the DB can legitimately be empty (unseeded page,
//     unknown slug, row that no longer matches its schema). Return null / [] and
//     let the page render an empty/"unavailable" state.
//   • anything else (API down, 5xx, timeout) is UNEXPECTED — throw a real Error
//     so the nearest error boundary (app/error.tsx) shows a retry UI instead of
//     the page quietly rendering as if the data were empty.
// (apiClient normalises every failure to an ApiErrorBody; network errors arrive
// as statusCode 500.)

function describe(err: unknown): string {
  const e = err as Partial<ApiErrorBody> | undefined;
  return `${e?.statusCode ?? "?"} ${e?.message ?? "unknown error"}`;
}

export const isNotFound = (err: unknown): boolean =>
  (err as Partial<ApiErrorBody> | undefined)?.statusCode === 404;

/** Wraps an ApiErrorBody (a plain object) in an Error so boundaries get a stack + digest. */
export function toError(path: string, err: unknown): Error {
  return err instanceof Error
    ? err
    : new Error(`GET ${path} failed: ${describe(err)}`);
}

/** GET a single-document endpoint. null = 404, empty, or fails `schema`. Throws otherwise. */
export async function getDocument<T>(
  path: string,
  schema?: ZodType<T>,
): Promise<T | null> {
  try {
    const { data } = await apiClient.get<ApiResponseBody<unknown>>(path);
    const doc = data.response.data[0];
    if (doc == null) return null;
    if (!schema) return doc as T;
    const parsed = schema.safeParse(doc);
    if (!parsed.success) {
      // A stored row that no longer matches the contract must not crash the page.
      console.error(
        `[content] ${path} does not match its schema — treating as empty:`,
        parsed.error.issues.slice(0, 5),
      );
      return null;
    }
    return parsed.data;
  } catch (err) {
    if (isNotFound(err)) return null;
    throw toError(path, err);
  }
}

/** GET a list endpoint. [] = 404 or empty. Throws on real failures. */
export async function getList<T>(
  path: string,
  params?: Record<string, unknown>,
): Promise<T[]> {
  try {
    const { data } = await apiClient.get<ApiResponseBody<T>>(path, { params });
    return data.response.data ?? [];
  } catch (err) {
    if (isNotFound(err)) return [];
    throw toError(path, err);
  }
}

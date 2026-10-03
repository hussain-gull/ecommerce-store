/**
 * Converts any Date or ISO string (in any timezone) to a UTC ISO-8601 string.
 * Always store the return value in the database — never raw Date objects.
 *
 * Example: 2024-01-01T10:30:00+05:30 (IST) → 2024-01-01T05:00:00.000Z (UTC)
 */
export function toUtcIso(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) throw new Error(`Invalid date value: "${value}"`);
  return d.toISOString(); // always UTC
}

/**
 * Returns the current wall-clock time as a UTC ISO-8601 string.
 * Use this wherever `NOW()` / `CURRENT_TIMESTAMP` would appear in SQL.
 */
export function nowUtc(): string {
  return new Date().toISOString();
}

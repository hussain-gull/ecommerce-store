// Post-login redirect target from `?next=`. Same-site paths only — anything
// else (absolute URL, protocol-relative `//host`, backslash tricks) falls back,
// so the login page can't be used as an open redirect.
export function safeNext(
  value: string | string[] | undefined,
  fallback = "/account",
): string {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.startsWith("/") && !v.startsWith("//") && !v.includes("\\")
    ? v
    : fallback;
}

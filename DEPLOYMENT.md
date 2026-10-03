# Pre-deployment checklist

Work through this top to bottom before going live. Assumes the storefront, admin and API share **one registrable domain**, e.g. `shop.example.com`, `admin.example.com`, `api.example.com`. This is required: refresh cookies are `sameSite=strict`.

## 1. Infrastructure to provision

- [ ] **PostgreSQL** with SSL; the DB role must be allowed to `CREATE EXTENSION` (`pg_trgm`, `fuzzystrmatch` — created at API startup).
- [ ] **Redis** with a password. Used for caching **and refresh-token revocation** — if Redis is down, logout/password-reset stop invalidating refresh tokens (fails open).
- [ ] **Cloudinary** account (uploads), **Resend** account with a verified sending domain (order + reset emails).
- [ ] **HTTPS everywhere** (TLS certs for all three hostnames). HSTS is already sent by the storefront.
- [ ] A reverse proxy / load balancer in front of the API → set `TRUST_PROXY_HOPS` (see below).

## 2. Environment variables

Generate fresh secrets for production — never reuse local ones:

```bash
openssl rand -hex 32   # run twice: JWT_SECRET and ADMIN_JWT_SECRET (must differ)
```

### `apps/api` (server-side, secret)

| Variable                                                      | Required           | Value                                                                                                                                                                 |
| ------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                                    | yes                | `production` (enables `secure` cookies + startup checks)                                                                                                              |
| `PROCESS_PORT`                                                | no                 | `4000`                                                                                                                                                                |
| `DATABASE_URL`                                                | yes                | `postgresql://user:pass@host:5432/db?sslmode=require`                                                                                                                 |
| `JWT_SECRET`                                                  | yes                | 32+ random chars                                                                                                                                                      |
| `ADMIN_JWT_SECRET`                                            | yes                | 32+ random chars, **different** from `JWT_SECRET` (API exits on boot otherwise)                                                                                       |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL`                          | no                 | `15m` / `7d`                                                                                                                                                          |
| `ADMIN_JWT_ACCESS_TTL` / `ADMIN_JWT_REFRESH_TTL`              | no                 | `15m` / `1d`                                                                                                                                                          |
| `REFRESH_COOKIE_NAME` / `REFRESH_COOKIE_TTL_DAYS`             | no                 | `refresh_token` / `7` (keep in sync with refresh TTL)                                                                                                                 |
| `ADMIN_REFRESH_COOKIE_NAME` / `ADMIN_REFRESH_COOKIE_TTL_DAYS` | no                 | keep in sync with admin refresh TTL                                                                                                                                   |
| `BCRYPT_SALT_ROUNDS`                                          | no                 | `12`                                                                                                                                                                  |
| `RESET_TOKEN_TTL_MINUTES`                                     | no                 | `60`                                                                                                                                                                  |
| `FRONTEND_URL`                                                | yes                | `https://shop.example.com` (reset-password links)                                                                                                                     |
| `CORS_ORIGINS`                                                | yes                | `https://shop.example.com,https://admin.example.com` — exact origins, no trailing slash. Also drives the CSRF Origin check; a wrong value = 403 on your own frontends |
| `TRUST_PROXY_HOPS`                                            | yes behind a proxy | `1` for one proxy/LB, else rate limits key on the proxy IP                                                                                                            |
| `RESEND_API_KEY`                                              | yes                | `re_...`                                                                                                                                                              |
| `EMAIL_FROM`                                                  | yes                | `"My Store" <noreply@yourdomain.com>`                                                                                                                                 |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET`          | yes                | from the Cloudinary dashboard                                                                                                                                         |
| `CLOUDINARY_ROOT_FOLDER`                                      | yes                | e.g. `store`                                                                                                                                                          |
| `REDIS_URL`                                                   | yes                | `redis://:password@host:6379`                                                                                                                                         |
| `CACHE_TTL_SECONDS` / `CACHE_LONG_TTL_SECONDS`                | no                 | `300` / `86400`                                                                                                                                                       |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD`               | seed only          | strong password; remove after seeding                                                                                                                                 |
| `RATE_LIMIT_DISABLED`                                         | **never**          | leave unset                                                                                                                                                           |
| `TEST_DATABASE_URL`                                           | tests only         | scratch DB whose name contains `test`                                                                                                                                 |

### `apps/web` (public — bundled into the browser, no secrets)

- `NEXT_PUBLIC_API_URL=https://api.example.com`
- `NEXT_PUBLIC_SITE_URL=https://shop.example.com`

### `apps/admin` (public)

- `VITE_API_URL=https://api.example.com`

## 3. First-time database setup

```bash
pnpm install --frozen-lockfile
cd apps/api
pnpm prisma db migrate     # apply migrations (see apps/api/CONTEXT.md "Team workflow")
pnpm seed:admin            # creates the admin login from ADMIN_* vars
pnpm seed:content          # page copy; unseeded pages return 404
```

Then **remove `ADMIN_PASSWORD` from the environment**.

## 4. Build & run

```bash
pnpm --filter api build   # type-check only
pnpm --filter api start   # runs src/index.ts with tsx (the shared contracts package ships TypeScript source, so plain `node dist` cannot load it)
# the API must be reachable at NEXT_PUBLIC_API_URL while this runs: pages like /blog and /about-us prerender from API content
pnpm --filter web build && pnpm --filter web start   # Next.js on :3000
pnpm --filter admin build                            # static files in apps/admin/dist
```

Run the API under a process manager (systemd/pm2/Docker) that restarts it on crash. Run **one API instance** unless you first move rate-limit counters and the review-media cleanup cron out of process (see `ponytail:` comments in `src/index.ts` and `rate-limit.middleware.ts`).

## 5. Security headers for the admin SPA

The admin is static, so its host must send these (nginx / Netlify / Cloudflare Pages):

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains
Content-Security-Policy: default-src 'self'; img-src 'self' data: blob: https://res.cloudinary.com; connect-src 'self' https://api.example.com; frame-ancestors 'none'
```

Also configure the SPA fallback (all paths → `index.html`). Test the admin CSP in the browser console before relying on it (tesseract.js loads workers/WASM; you may need `worker-src blob:` / `script-src 'wasm-unsafe-eval'`).

## 6. Storefront CSP rollout

`apps/web/next.config.js` sends `Content-Security-Policy-Report-Only` (logs violations, blocks nothing). After deploy: browse every page/flow with the console open; when no violations appear, rename the header to `Content-Security-Policy` to enforce.

## 7. Verify before announcing

- [ ] `GET https://api.example.com/health` → `{"status":"ok"}`; no startup `WARNING`/`FATAL` in API logs.
- [ ] Sign up, log in, refresh the page (session survives), log out; same for admin.
- [ ] Place a test order with payment-proof upload; confirm emails arrive; confirm/cancel it in admin.
- [ ] Forgot-password email link works and old sessions are signed out afterwards.
- [ ] Response headers: `curl -I https://shop.example.com` shows HSTS, `X-Frame-Options`, CSP-Report-Only, no `X-Powered-By`.
- [ ] Cookies in devtools: `HttpOnly`, `Secure`, `SameSite=Strict`.
- [ ] A request from a foreign `Origin` is rejected: `curl -X POST -H 'Origin: https://evil.com' https://api.example.com/api/v1/auth/login` → 403.
- [ ] `pnpm audit --prod` is clean (one moderate `valibot` advisory is known/transitive).
- [ ] `pnpm --filter api test:integration` passes against a scratch DB.

## 8. Operations

- Database backups + a tested restore; Redis persistence is optional (cache only).
- Log shipping/alerts for 5xx; the API logs unexpected errors server-side and returns a generic message.
- Rotate secrets if leaked: changing `JWT_SECRET`/`ADMIN_JWT_SECRET` signs everyone out. `pnpm seed:admin` resets admin credentials.

## Known gaps (accepted for launch)

- Admin has no MFA (add TOTP before adding more admins).
- Rate limits are per-instance (move to Redis before scaling out).
- Storefront CSP allows inline scripts until nonces are implemented.

# API — Express + Prisma backend

Express 5 + TypeScript REST API (port 4000) backed by PostgreSQL via Prisma ORM 8 (RC).

> **Keeping this current:** after a change that alters routes, env vars, patterns or rules, update this file (and the root `AGENTS.md` if it affects the whole repo). It is the single source of context for contributors and AI coding agents working in `api`.

## Part 1 — Overview and reference

Express 5 + TypeScript REST API for the ecommerce platform.

---

### Stack

| Concern         | Library                                                                             |
| --------------- | ----------------------------------------------------------------------------------- |
| Framework       | Express 5                                                                           |
| Validation      | Zod 4 (schemas shared via `@ecommerce/contracts`)                                   |
| Auth            | bcryptjs + jsonwebtoken                                                             |
| Cookies         | cookie-parser                                                                       |
| CORS            | cors (credentials + origin scoped to frontend)                                      |
| Database        | PostgreSQL via Prisma ORM 8 RC (`@prisma/orm-postgres`)                             |
| ORM             | Prisma 8 RC — contract-based, fully typed (`src/prisma/`)                           |
| Email           | Resend SDK (`resend`) — welcome + password-reset; stdout in dev, Resend API in prod |
| Scheduling      | `node-cron` — in-process daily job, see "Scheduled jobs" below                      |
| Types + Schemas | `@ecommerce/contracts` (workspace package)                                          |
| Runtime         | Node 20 + `tsx` (dev), compiled JS (prod)                                           |

### Getting started

```bash
# from monorepo root
pnpm dev --filter api
```

The API runs on **port 4000**. The web app runs on port 3000. Both must run for auth to work.

Copy `.env.example` to `.env` and fill in real values before running.

### Environment variables

All tunables live in `.env`. The server reads them through `src/config.ts` — never read `process.env` directly inside services or controllers.

| Variable                  | Default                            | Description                                                                          |
| ------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| `DATABASE_URL`            | —                                  | PostgreSQL connection string                                                         |
| `JWT_SECRET`              | —                                  | **Required.** Min 32 random chars. Server throws if missing.                         |
| `JWT_ACCESS_TTL`          | `15m`                              | Access token lifetime (jsonwebtoken format: `15m`, `1h`)                             |
| `JWT_REFRESH_TTL`         | `7d`                               | Refresh token lifetime — keep in sync with `REFRESH_COOKIE_TTL_DAYS`                 |
| `BCRYPT_SALT_ROUNDS`      | `12`                               | bcrypt work factor (min 12 for production)                                           |
| `REFRESH_COOKIE_NAME`     | `refresh_token`                    | Name of the HttpOnly refresh cookie                                                  |
| `REFRESH_COOKIE_TTL_DAYS` | `7`                                | Refresh cookie lifetime in whole days                                                |
| `RESET_TOKEN_TTL_MINUTES` | `60`                               | Password-reset link lifetime in minutes                                              |
| `FRONTEND_URL`            | `http://localhost:3000`            | Used to build the reset-password link in emails                                      |
| `PROCESS_PORT`            | `4000`                             | Port the Express server listens on                                                   |
| `NODE_ENV`                | `development`                      | `production` enables secure cookies + real SMTP                                      |
| `RESEND_API_KEY`          | —                                  | Resend API key — leave empty in dev (logs reset URL to stdout instead)               |
| `EMAIL_FROM`              | `"My Store" <noreply@example.com>` | From address. Use `onboarding@resend.dev` on the free tier until domain is verified. |

### Database setup

Tables are managed by **Prisma ORM 8 RC** via `src/prisma/contract.prisma`. No raw `pg` pool.

#### First-time setup (empty database)

```bash
pnpm prisma contract emit   # regenerate contract.json + contract.d.ts
pnpm prisma db init         # create all tables
pnpm seed:admin             # create the admin login (needs ADMIN_EMAIL/ADMIN_PASSWORD in .env)
pnpm seed:content           # load the page copy (home/about/contact/blog/condition guide)
```

#### After changing models

```bash
pnpm prisma contract emit   # regenerate types
pnpm prisma db update       # apply additive changes
```

#### Team workflow (migration files)

```bash
pnpm prisma migration plan  # generate a migration plan
pnpm prisma db migrate      # apply it
```

> `pnpm prisma` reads `DATABASE_URL` from `.env` automatically via `prisma.config.ts`.

### Scheduled jobs

Registered in `index.ts` with `node-cron`, in-process (no external scheduler/queue):

| Job                                     | Schedule                | Purpose                                                                                                                                                                                           |
| --------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cleanupStaleReviewMediaUploadsService` | `0 3 * * *` (daily 3am) | Recycles `review_media_uploads` rows (+ moves their Cloudinary asset to `recycle-bin/`) older than 24h that were never attached to a review — e.g. the user uploaded a photo then closed the tab. |

Single-instance only — if this API ever runs behind a multi-instance deploy, move scheduling to a hosted cron hitting an internal endpoint instead, so the job doesn't fire once per instance.

### API reference

All responses use the shared envelope from `@ecommerce/contracts`.

#### Success envelope

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Human-readable message.",
  "response": { "data": [], "paginationMeta": null }
}
```

#### Error envelope

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed.",
  "errors": [{ "field": "email", "message": "Invalid email address" }]
}
```

`field` is `null` for non-field errors.

---

#### Product search — `GET /api/v1/products/suggest?q=`

Public typeahead for the storefront top bar (`q` 2–100 chars, max 6 results: id, name, slug, price, salePrice, img, brand). Matches name/brand by substring plus typos via `pg_trgm` + `fuzzystrmatch`. `search.service.ts#ensureSearchIndexes` creates both extensions and a trigram index on `products.name` at startup (idempotent — the ORM migrations can't create extensions, and the DB role must be allowed to `CREATE EXTENSION`). Uses the raw `pg` pool from `utils/db.util.ts`.

#### Auth routes — `POST /api/v1/auth/*`

| Method | Path                           | Auth required  | Description                                         |
| ------ | ------------------------------ | -------------- | --------------------------------------------------- |
| POST   | `/api/v1/auth/register`        | —              | Register a new user                                 |
| POST   | `/api/v1/auth/login`           | —              | Authenticate; receive access token + refresh cookie |
| POST   | `/api/v1/auth/refresh`         | refresh cookie | Rotate both tokens                                  |
| POST   | `/api/v1/auth/logout`          | Bearer token   | Clear the refresh cookie                            |
| POST   | `/api/v1/auth/forgot-password` | —              | Request a password-reset email                      |
| POST   | `/api/v1/auth/reset-password`  | —              | Set new password using the reset token              |

##### POST `/api/v1/auth/register`

```json
// Request
{ "firstName": "Jane", "lastName": "Doe", "email": "jane@example.com", "password": "secret123" }

// 201 — Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh
{ "success": true, "statusCode": 201, "message": "Account created successfully.",
  "response": { "data": [{ "user": { ... }, "accessToken": "..." }], "paginationMeta": null } }
```

##### POST `/api/v1/auth/login`

Same shape as register; 200 on success.

##### POST `/api/v1/auth/refresh`

No request body — refresh cookie sent automatically. Returns `{ accessToken }`. Rotates both tokens.

##### POST `/api/v1/auth/logout`

Requires `Authorization: Bearer <accessToken>`. Clears the refresh cookie.

##### POST `/api/v1/auth/forgot-password`

```json
// Request
{ "email": "jane@example.com" }

// 200 — always, regardless of whether the email is registered (prevents enumeration)
{ "success": true, "statusCode": 200, "message": "If that email is registered, a reset link has been sent.", ... }
```

##### POST `/api/v1/auth/reset-password`

```json
// Request
{ "token": "<64-char hex from email URL>", "password": "newSecret123" }

// 200
{ "success": true, "statusCode": 200, "message": "Password updated successfully. ...", ... }

// 400 — invalid token, expired token, or already-used token
{ "success": false, "statusCode": 400, "message": "This reset link has expired. Please request a new one.", ... }
```

---

#### Address routes — `/api/v1/addresses/*`

All routes require `Authorization: Bearer <accessToken>`.

| Method | Path                    | Description                                         |
| ------ | ----------------------- | --------------------------------------------------- |
| GET    | `/api/v1/addresses`     | List all saved addresses for the authenticated user |
| POST   | `/api/v1/addresses`     | Save a new address                                  |
| DELETE | `/api/v1/addresses/:id` | Delete an address (ownership enforced)              |

##### GET `/api/v1/addresses`

```json
// 200
{
  "success": true,
  "statusCode": 200,
  "message": "Addresses retrieved.",
  "response": {
    "data": [
      {
        "id": "uuid",
        "userId": "uuid",
        "label": "Home",
        "firstName": "Jane",
        "lastName": "Doe",
        "line1": "123 Main St",
        "line2": null,
        "city": "Lahore",
        "postcode": "54000",
        "country": "Pakistan",
        "createdAt": "2026-09-16T10:00:00.000Z"
      }
    ],
    "paginationMeta": null
  }
}
```

##### POST `/api/v1/addresses`

```json
// Request
{
  "firstName": "Jane",
  "lastName": "Doe",
  "line1": "123 Main St",
  "line2": "Flat 2",
  "city": "Lahore",
  "postcode": "54000",
  "country": "Pakistan",
  "label": "Home"
}

// 201 — returns the created address in data[0]
```

##### DELETE `/api/v1/addresses/:id`

```json
// 200
{
  "success": true,
  "statusCode": 200,
  "message": "Address deleted.",
  "response": { "data": [], "paginationMeta": null }
}

// 404 — address not found
// 403 — address belongs to a different user
```

---

#### Contact routes — `/api/v1/contact`

Public — no `Authorization` header required. Anyone (guest or signed-in) can submit.

| Method | Path              | Auth required | Description                 |
| ------ | ----------------- | ------------- | --------------------------- |
| POST   | `/api/v1/contact` | —             | Submit a contact-us message |

##### POST `/api/v1/contact`

```json
// Request — all fields required, validated by contactMessageSchema (@ecommerce/contracts)
{
  "name": "Jane Doe",
  "phone": "03001234567",
  "email": "jane@example.com",
  "subject": "Order inquiry",
  "message": "Hello, I have a question about my order."
}

// 201 — no data returned to the submitter; row is stored for the future admin dashboard
{ "success": true, "statusCode": 201, "message": "Message sent successfully.", "response": { "data": [], "paginationMeta": null } }
```

- `phone` is normalised to Pakistani E.164 (`+92XXXXXXXXXX`) via the shared `normalizePhone` util (`@ecommerce/contracts`), same as `signupSchema`.
- Stored in `contact_messages` with `status: "new"` — no `user_id`; this is a public write, not an ownership-enforced resource.
- No read endpoint yet — retrieval/status updates (`read`/`replied`) are deferred to the admin dashboard work.

---

#### Product routes — `/api/v1/products/*`, `/api/v1/admin/products/*`, `/api/v1/reviews/*`

| Method | Path                                | Auth required | Description                                                                                |
| ------ | ----------------------------------- | ------------- | ------------------------------------------------------------------------------------------ |
| GET    | `/api/v1/products`                  | —             | List published products (public storefront)                                                |
| GET    | `/api/v1/products/:slug`            | —             | Published product detail                                                                   |
| GET    | `/api/v1/admin/products`            | admin         | List all products (draft + published)                                                      |
| POST   | `/api/v1/admin/products`            | admin         | Create product (+ variants, media)                                                         |
| PATCH  | `/api/v1/admin/products/:id`        | admin         | Update product (variants/media replaced wholesale)                                         |
| DELETE | `/api/v1/admin/products/:id`        | admin         | Delete product                                                                             |
| GET    | `/api/v1/reviews`                   | —             | List store-wide reviews (not scoped to a product)                                          |
| POST   | `/api/v1/reviews`                   | user          | Create a review for an `orderId` — requires the order to be `delivered`; 403/409 otherwise |
| POST   | `/api/v1/media/review-upload`       | user          | Upload a review photo (hardcoded `category: "review"`)                                     |
| POST   | `/api/v1/media/review-upload-video` | user          | Upload a review video (hardcoded `category: "review"`)                                     |
| DELETE | `/api/v1/media/review-upload`       | user          | Delete a review attachment by URL (restricted to the `review` Cloudinary folder)           |

- No checkout/order-creation endpoint exists — `orders`/`order_items` are a minimal FK anchor for the review gate only. Reviews are store-wide (thrift stock is one-off, so there's no per-product listing to re-browse) — **one review per order**, however many products it contains.
- Product/review media uploads reuse the existing `/api/v1/media` Cloudinary pipeline with categories `"product"`/`"review"`.
- Adding a product/wishlist/cart item to a nonexistent or unpublished product 404s — `addCartItemService`/`addWishlistItemService` check first (better error than a raw FK violation); the DB-level FK on `product_id` is the backstop.
- `GET /api/v1/products` (unfiltered) and `GET /api/v1/filter-options` are cached in Redis (`CACHE_TTL_SECONDS`, default 300s; `/content/*`, `/content/payment` and filter options use `CACHE_LONG_TTL_SECONDS`, default 86400s) and invalidated on every product/filter-option write. Redis is optional — a connection failure just disables the cache, requests still succeed.

#### Admin-managed shop filters — `/api/v1/filter-options`, `/api/v1/admin/filter-options/*`

One table (`filter_options`, discriminated by `kind`) backs five of the six shop filter facets: `category`, `brand`, `surface`, `size`, `colour`, plus `condition` (referenced by `products.condition_id` as a real FK). `gender` is excluded — it's a fixed 3-value enum, not an admin-curated vocabulary. See `apps/api/CONTEXT.md` § "Admin-managed shop filters" for the full explanation and the facet-to-column mapping.

| Method | Path                               | Auth required | Description                                                                                                                                                                                   |
| ------ | ---------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/v1/filter-options`           | —             | List every filter option, all kinds (public — feeds shop filter)                                                                                                                              |
| GET    | `/api/v1/admin/filter-options`     | admin         | Same list, admin-mounted                                                                                                                                                                      |
| POST   | `/api/v1/admin/filter-options`     | admin         | Create an option (`{ "kind": "brand", "name": "Nike" }`) — slug is derived server-side, unique per kind. For `kind: "category"`, pass `parentId` to create a subcategory of that category id. |
| PATCH  | `/api/v1/admin/filter-options/:id` | admin         | Rename an option / reassign a category's parent (`{ "name": "...", "parentId"?: "..." }`) — `kind` is immutable                                                                               |
| DELETE | `/api/v1/admin/filter-options/:id` | admin         | Delete an option                                                                                                                                                                              |

Managed entirely from the admin panel's dedicated **Shop Filters** page (`/filters`) — not from the Products page, which only reads these lists to populate its Category/Brand/Surface selects.

Filter options are stored in Postgres (`filter_options`), not a JSON file — see `apps/api/CONTEXT.md` § "Admin-managed shop filters" for why.

### CORS and CSRF

Allowed origins come from `CORS_ORIGINS` (exact match, never `*`; credentials are on). Frontend calls must send credentials (`withCredentials: true`). State-changing requests whose `Origin` header is not in the allowlist get 403, on top of `sameSite=strict` cookies. See `config.corsOrigins` and `index.ts`.

---

### Token strategy

| Token         | Lifetime                                   | Delivery                                                                   | Storage                                                                         |
| ------------- | ------------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Access token  | `JWT_ACCESS_TTL` (default 15 min)          | JSON response body                                                         | In memory only (Zustand, not persisted); restored by a silent refresh on reload |
| Refresh token | `JWT_REFRESH_TTL` (default 7 days)         | `Set-Cookie: HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh` | Browser cookie only                                                             |
| Reset token   | `RESET_TOKEN_TTL_MINUTES` (default 60 min) | Email URL parameter                                                        | SHA-256 hash stored in DB — raw token only in the email                         |

- Refresh cookie is **path-scoped** — browser sends it only to `/api/v1/auth/refresh`.
- Refresh rotates **both** tokens on every call.
- Refresh tokens are revoked on logout and password reset (`utils/token-revocation.util.ts`, Redis "revoked before" stamp; fails open if Redis is down).
- Reset tokens are **single-use** (`used_at` stamped on first consumption).
- Reset tokens are **purged on new request** — only the latest link is ever valid.

### Password reset flow

```
1. POST /auth/forgot-password { email }
   → service looks up user (silent if not found)
   → deletes existing tokens for that user
   → generates crypto.randomBytes(32) raw token
   → stores SHA-256(raw token) in password_reset_tokens table
   → sends email with link: FRONTEND_URL/reset-password?token=<raw>

2. User clicks link → frontend /reset-password?token=<raw>

3. POST /auth/reset-password { token, password }
   → validates 64-char hex format
   → hashes token, looks up record
   → checks used_at (single-use) + expires_at (TTL)
   → bcrypt-hashes new password, updates users.password_hash
   → stamps used_at on the token record
```

### Project structure

```
apps/api/
├── src/
│   ├── index.ts               # Entry — Express setup, CORS, route mounting, global error handler
│   ├── config.ts              # Central config — reads all env vars with safe defaults
│   ├── prisma/
│   │   ├── contract.prisma    # Model definitions (users, password_reset_tokens) — source of truth
│   │   ├── contract.json      # Compiled contract (generated — commit to git)
│   │   ├── contract.d.ts      # ORM type definitions (generated — commit to git)
│   │   └── db.ts              # Prisma client singleton — import { db } from here
│   ├── routes/
│   │   ├── auth.route.ts      # Auth route declarations + middleware attachment
│   │   ├── address.route.ts   # Address CRUD routes (all protected by authenticate)
│   │   └── contact.route.ts   # Contact-us submission route (public, no auth)
│   ├── controllers/
│   │   ├── auth.controller.ts # Zod validation → call service; set/clear cookies
│   │   ├── address.controller.ts # Zod validation → list/create/delete addresses
│   │   └── contact.controller.ts # Zod validation → store a contact-us message
│   ├── services/
│   │   ├── auth.service.ts    # Business logic: register, login, refresh, forgot/reset password
│   │   ├── address.service.ts # Business logic: list, create, delete addresses (ownership enforced)
│   │   └── contact.service.ts # Business logic: store a contact-us message (public write)
│   ├── middleware/
│   │   └── auth.middleware.ts # authenticate() — verifies Bearer token, sets req.user
│   ├── types/
│   │   ├── jwt.ts             # JwtPayload type (sub, email, iat, exp)
│   │   └── express.d.ts       # Module augmentation — req.user?: JwtPayload
│   └── utils/
│       ├── response.util.ts   # sendSuccess() / sendError() / createHttpError()
│       ├── email.util.ts      # sendPasswordResetEmail() — SMTP or stdout in dev
│       ├── datetime.util.ts   # nowUtc() / toUtcIso() — UTC-safe timestamps
│       └── zod-errors.util.ts # zodErrors(ZodError) → ApiFieldError[]
├── prisma.config.ts           # Prisma CLI config — points at contract.prisma + DATABASE_URL
├── .env.example               # Template — copy to .env and fill in
├── package.json
├── tsconfig.json
├── CONTEXT.md                 # This file — overview, API reference and conventions
└── CLAUDE.md                  # Imports CONTEXT.md for Claude Code
```

#### Orders

- `GET /api/v1/content/payment` — (public) JazzCash account name/number, support phone, QR URL (DB-backed; blanks = not set up, orders 503). `PUT` (admin) edits them.
- `POST /api/v1/media/payment-upload` — (auth) upload the JazzCash payment screenshot (image, ≤8MB) → `{ url }`. Must be used for an order within 24h or it is moved to the Cloudinary recycle bin.
- `POST /api/v1/orders` — (auth) place an order from the caller's cart. Body: `placeOrderSchema` (idempotency key, contact, shipping address, shipping method, screenshot URL). 201 → `{ id, status: "pending", totalPrice, shippingCost, createdAt }`; a repeated key returns the same order. 400 empty cart / bad screenshot URL, 409 if any item is sold out (`errors[].field` = product ids; nothing is decremented). Sends a "payment received" email.
- `GET /api/v1/orders/admin` — (admin) all orders with items, address, payment screenshot.
- `PATCH /api/v1/orders/admin/:id/confirm` — (admin) `pending` → `processing`; emails the customer "order accepted".
- `PATCH /api/v1/orders/admin/:id/cancel` — (admin) `pending`/`processing` → `cancelled`, returns stock.
- `PATCH /api/v1/orders/admin/:id/status` — (admin) body `{ "status": "shipped" | "delivered" }`; `processing → shipped → delivered`.

See "Orders, JazzCash payment & stock" in Part 2 of this file.

- `GET /api/v1/cart` items carry `availableStock` (live stock for that size/color; 0 = sold out).

> **Cloudinary recycle bin:** removed media is never destroyed — it is moved to `<root>/recycle-bin/<original path>` (see `cloudinary.util.ts`). Restore by renaming the asset back; clear the bin manually in the Cloudinary console.

> **Rate limiting & headers:** all routes go through `helmet` and a global limiter; login/register/password-reset, uploads, orders and the contact form have stricter limits (429 envelope). Set `TRUST_PROXY_HOPS` behind a proxy. Tests: `pnpm test:integration` (needs `TEST_DATABASE_URL`). See Part 2 of this file.

> **Page content:** the home/about/contact/blog/condition-guide pages live in the `site_content` table (edited via `PUT /api/v1/content/<page>`, admin only). Fill it on every new environment with `pnpm seed:content` (idempotent; `-- --force` overwrites). Unseeded pages return 404. See Part 2 of this file § "Page content".

## Part 2 — Engineering conventions

Read this before writing any code in this service. These conventions are enforced by type-checking and code review.

### Layered architecture

```
Route → Controller → Service → Database
```

| Layer          | Location                          | Responsibility                                                                        |
| -------------- | --------------------------------- | ------------------------------------------------------------------------------------- |
| **Route**      | `src/routes/*.route.ts`           | Declare endpoints; attach middleware (e.g. `authenticate`). No logic.                 |
| **Controller** | `src/controllers/*.controller.ts` | Validate request with Zod; set/clear cookies; call service; never touch DB.           |
| **Service**    | `src/services/*.service.ts`       | All business logic and DB queries. Never import Express types (`Request`/`Response`). |
| **Middleware** | `src/middleware/*.middleware.ts`  | Pure request/response transforms. Stateless.                                          |
| **Util**       | `src/utils/*.util.ts`             | Shared, stateless helpers. No business logic, no DB calls.                            |

### Configuration — always use `config.ts`

All tunable values live in `src/config.ts`. **Never** read `process.env` directly inside services, controllers, or utilities.

```ts
import { config } from "../config.js";

config.jwtSecret; // JWT signing secret (throws if JWT_SECRET missing)
config.jwtAccessTtl; // "15m"  — JWT_ACCESS_TTL
config.jwtRefreshTtl; // "7d"   — JWT_REFRESH_TTL
config.bcryptSaltRounds; // 12     — BCRYPT_SALT_ROUNDS
config.refreshCookieName; // "refresh_token" — REFRESH_COOKIE_NAME
config.refreshCookieTtlMs; // 604800000 — REFRESH_COOKIE_TTL_DAYS * 24h in ms
config.resetTokenTtlMs; // 3600000  — RESET_TOKEN_TTL_MINUTES * 60s in ms
config.frontendUrl; // "http://localhost:3000" — FRONTEND_URL
config.resendApiKey; // ""    — RESEND_API_KEY (empty = stdout dev mode)
config.emailFrom; // '"My Store" <noreply@example.com>' — EMAIL_FROM
```

When adding a new env-driven tunable:

1. Add a field to `config.ts` with a safe default.
2. Add the variable to `.env.example` with a comment.
3. Document it in the env-variables table in this file.

### Response envelope — always use the utils

**Never** call `res.json()` directly. Always use:

```ts
import { sendSuccess, sendError } from "../utils/response.util.js";

sendSuccess(res, 200, "Message.", [data]); // data[] goes into response.data
sendSuccess(res, 201, "Created.", [item], meta); // with pagination meta
sendError(res, 422, "Validation failed.", errors); // errors[] with field + message
sendError(res, 401, "Access token is missing."); // no errors array needed
```

**Success shape**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "...",
  "response": { "data": [], "paginationMeta": null }
}
```

**Error shape**

```json
{
  "success": false,
  "statusCode": 422,
  "message": "...",
  "errors": [{ "field": "email", "message": "Invalid email address" }]
}
```

`field` is `null` for errors that don't map to a single form field.

### Validation with Zod

- Zod schemas live in **`packages/contracts/src/schemas/`** — the single source of truth shared between frontend and backend.
- Import schemas directly from `@ecommerce/contracts`:
  ```ts
  import {
    signupSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
  } from "@ecommerce/contracts";
  ```
- Never define duplicate schemas in `apps/api/src/`. Add new schemas to `packages/contracts/src/schemas/`.
- Use `schema.safeParse()` (not `parse()`) — you control the error format.
- Convert `ZodError` → `ApiFieldError[]` with the shared util:
  ```ts
  import { zodErrors } from "../utils/zod-errors.util.js";
  sendError(res, 422, "Validation failed.", zodErrors(parsed.error));
  ```
- Schema shapes must `satisfies z.ZodType<ContractType>` to stay in sync with the contract types.

### Types

- All shared types live in `packages/contracts/src/` (domain files) or `packages/contracts/src/shared.ts`.
- Use `type` aliases — **no `interface`**.
- Use TypeScript built-in utilities (`Pick`, `Omit`, `Partial`, `ReturnType`, etc.) to derive types; never hand-copy shapes.
- API-internal types (e.g. `JwtPayload`) that are not shared with the frontend live in `src/types/`.
- Every function parameter and return type must be explicitly typed. No `any` except the `nowUtc() as any` cast required by `TimestamptzString`.

### Auth middleware

```ts
import { authenticate } from "../middleware/auth.middleware.js";

// Protect a route
authRouter.post("/logout", authenticate, authLogout);
```

- `authenticate` reads `Authorization: Bearer <token>`, calls `jwt.verify`, and populates `req.user: JwtPayload`.
- On failure it calls `sendError` directly — it does **not** call `next(err)`, so the global handler is bypassed.
- `req.user` is typed via the module augmentation in `src/types/express.d.ts` — no cast needed.

### Token and cookie rules

| Token         | Lifetime                          | Transport                                                             |
| ------------- | --------------------------------- | --------------------------------------------------------------------- |
| Access token  | `config.jwtAccessTtl` (15 min)    | JSON response body → Zustand memory on client                         |
| Refresh token | `config.jwtRefreshTtl` (7 days)   | `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh` cookie |
| Reset token   | `config.resetTokenTtlMs` (60 min) | Email URL only — SHA-256 hash stored in DB                            |

- **Never** send the refresh token in the JSON body.
- **Never** send the access token in a cookie.
- The refresh endpoint rotates **both** tokens on every call.
- Cookie path is scoped to `/api/v1/auth/refresh` — the browser will not send it to any other endpoint.
- Use `secure: process.env.NODE_ENV === "production"` — allows plain HTTP in development.

### Error handling

Throw service-layer errors with `createHttpError` from `response.util.ts`. Never use `Object.assign` directly.

```ts
import { createHttpError } from "../utils/response.util.js";

throw createHttpError(409, "Email is already registered.");
throw createHttpError(401, "Invalid email or password.");
throw createHttpError(
  400,
  "This reset link has expired. Please request a new one.",
);
```

`createHttpError` returns `Error & { statusCode: number }`. The global handler in `index.ts` reads `.statusCode` automatically.

- Controllers: never `res.send()` in a catch — always `next(err)`. The global handler formats it.
- Auth middleware is the only place that calls `sendError` directly in an error path (intentional bypass).

### Password reset security rules

- **No email enumeration**: `forgotPasswordService` always returns silently if the email isn't found.
- **Token format guard**: `/^[0-9a-f]{64}$/` checked before any DB query to reject malformed tokens cheaply.
- **Hash-only storage**: only `SHA-256(rawToken)` is stored. The raw token exists only in the email URL and never in the DB.
- **Single-use**: `used_at` is stamped on first consumption — any second attempt is rejected regardless of TTL.
- **Token rotation on new request**: all existing tokens for a user are deleted before a new one is issued.
- **Password update before token stamp**: if the password update fails, the token remains unconsumed so the user can retry.

### Email

Two transactional emails are sent — both live in `email.util.ts`. Never instantiate `Resend` or call the SDK directly from a service or controller.

```ts
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
} from "../utils/email.util.js";

// Called fire-and-forget after signup (errors are logged, never surfaced to the user)
sendWelcomeEmail({ to, firstName }).catch(console.error);

// Called (awaited) from forgotPasswordService
await sendPasswordResetEmail({ to, firstName, resetUrl, expiresAt });
```

| Email          | Trigger                           | Subject                                |
| -------------- | --------------------------------- | -------------------------------------- |
| Welcome        | `signupService` — fire-and-forget | `Welcome to {storeName}, {firstName}!` |
| Password reset | `forgotPasswordService` — awaited | `Reset your {storeName} password`      |

- In development (`RESEND_API_KEY` empty): logs to stdout — no external service needed.
- In production: sends via Resend API with inline HTML + plain-text. Both templates are in `email.util.ts`.
- The SDK returns `{ data, error }` — `email.util.ts` throws if `error` is set so the global handler catches it.
- **Resend Templates API** (`resend.templates.create/publish/update`) creates managed templates using `{{{VARIABLE}}}` Handlebars syntax. Use it to design/version templates in the Resend dashboard. For sending, `emails.send()` still uses inline `html:` — the Templates API is a design/management tool, not a send-time reference.
- Get a free Resend API key at https://resend.com (3,000 emails/month free tier).
- To update branding: edit `buildWelcomeEmailHtml` / `buildResetEmailHtml` (and their `*Text` counterparts) in `email.util.ts`.

### Database — Prisma ORM 8 RC

The project uses **Prisma ORM 8 RC** (`@prisma/orm-postgres`). There is no raw `pg` pool.

#### Client

```ts
import { db } from "../prisma/db.js";
```

`db` is the singleton Prisma client, typed against the contract. Never instantiate it again.

#### Query API

```ts
// Read one row (returns Row | null — always null-check)
const user = await db.orm.public.users.where({ email }).first();

// Select specific columns only
const row = await db.orm.public.users
  .select("id", "email")
  .where({ id })
  .first();

// All rows
const all = await db.orm.public.users.all();

// Insert (returns the full inserted row)
const created = await db.orm.public.users.create({
  id: crypto.randomUUID(),
  first_name: "Alice",
  last_name: "Smith",
  email: "alice@example.com",
  password_hash: hash,
  created_at: nowUtc() as any,
});

// Update
const updated = await db.orm.public.users
  .where({ id })
  .update({ first_name: "Bob" });

// Delete (deletes all rows matching the where clause)
await db.orm.public.password_reset_tokens.where({ user_id }).delete();
```

- ORM path: `db.orm.<schema>.<model>` — for the `public` schema: `db.orm.public.<modelName>`.
- Column names are **snake_case** in ORM calls. Map to camelCase manually when building contract types.
- `.first()` returns `Row | null`. Always null-check.
- `.create()` returns the full inserted row.
- Use `.select('col1', 'col2')` before `.where()` to fetch only needed columns.

#### Timestamp rule

`created_at` and `expires_at` are typed as `TimestamptzString` (a branded `string`). Always use `nowUtc()` and cast:

```ts
import { nowUtc } from "../utils/datetime.util.js";

created_at: nowUtc() as any; // ✅
expires_at: expiresAt.toISOString() as any; // ✅
created_at: new Date().toISOString(); // ❌ use nowUtc()
```

#### Adding a model

1. Add a `model <name> { ... }` block to `src/prisma/contract.prisma`.
2. Run `pnpm prisma contract emit` to regenerate `contract.json` and `contract.d.ts`.
3. Run `pnpm prisma db update` to apply to the database.
4. Commit `contract.prisma`, `contract.json`, and `contract.d.ts` together.

### Current DB models

| Model                   | Table                          | Purpose                                                                                                                                          |
| ----------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `users`                 | `public.users`                 | Registered accounts — email, bcrypt hash, name, phone, timestamps                                                                                |
| `password_reset_tokens` | `public.password_reset_tokens` | Single-use password reset tokens — stores SHA-256 hash, expiry, used_at                                                                          |
| `addresses`             | `public.addresses`             | Saved shipping/billing addresses — owned by `user_id`, optional label                                                                            |
| `contact_messages`      | `public.contact_messages`      | Contact-us form submissions — public write, no `user_id`; `status` ("new"/"read"/"replied") drives the future admin dashboard                    |
| `products`              | `public.products`              | Thrift-shop catalogue item — one-off inventory, `deleted_at` soft-delete marker                                                                  |
| `product_variants`      | `public.product_variants`      | Size/color/stock rows for a product — wholesale delete-then-reinsert on product update                                                           |
| `product_media`         | `public.product_media`         | Product image/video gallery, ordered; first row is the cover                                                                                     |
| `orders`                | `public.orders`                | Minimal order anchor (owner + `status`) — no checkout/payment flow, exists only to gate verified-purchase reviews                                |
| `order_items`           | `public.order_items`           | Line items linking an order to a `product_id` — used to prove a user actually bought a line item being reviewed                                  |
| `store_reviews`         | `public.store_reviews`         | Rating/comment gated on a `delivered` order's line item — store-wide, not per-product (thrift stock is one-off, so there's nothing to re-browse) |
| `review_media`          | `public.review_media`          | Photo/video attachments on a review                                                                                                              |
| `filter_options`        | `public.filter_options`        | Admin-managed filter taxonomy — `kind`/`name`/`slug`, one table backing category/brand/surface/size/colour                                       |

### UTC datetime — always use `datetime.util.ts`

```ts
import { nowUtc, toUtcIso } from "../utils/datetime.util.js";

const createdAt = nowUtc(); // ✅ server now, UTC ISO string
const ts = toUtcIso("2024-01-01T10:30:00+05:30"); // ✅ any TZ → UTC
const createdAt = new Date().toISOString(); // ❌ do not use directly in a service
```

PostgreSQL `TIMESTAMPTZ` stores UTC internally — the display offset is the session timezone, not the stored value.

### Naming conventions

| Thing                 | Convention                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| Route files           | `<domain>.route.ts`                                                                               |
| Controller files      | `<domain>.controller.ts`                                                                          |
| Service files         | `<domain>.service.ts`                                                                             |
| Middleware files      | `<name>.middleware.ts`                                                                            |
| Util files            | `<name>.util.ts`                                                                                  |
| Exported functions    | `camelCase`                                                                                       |
| DB table/column names | `snake_case`                                                                                      |
| Environment variables | `SCREAMING_SNAKE_CASE`                                                                            |
| REST URL segments     | lowercase, single word (`/register`, `/login`, `/refresh`, `/forgot-password`, `/reset-password`) |

### Ownership-enforced resources (addresses pattern)

When a resource is owned by a user (e.g. `addresses.user_id`):

1. **List**: always filter by `user_id` — never return rows from other users even if the ID is guessed.
2. **Create**: write `user_id` from `req.user.sub`, never from the request body.
3. **Delete**: fetch the row first and compare `row.user_id !== userId` → throw 403 before deleting.
4. **Update** (if added): same ownership check as delete.

Never trust the client to supply a userId for mutation operations — always derive it from the verified JWT payload (`req.user.sub`).

`cart_items.product_id`/`wishlist_items.product_id` now carry a DB-level FK to `products.id` on top of the service-layer check: `addCartItemService`/`addWishlistItemService` still 404 if the product doesn't exist or isn't published before writing the row (a better error than a raw FK violation), and the constraint is the backstop. `deleteProductService` **soft-deletes** — see "Product soft-delete & Cloudinary cleanup" below — so it only needs to clean up ephemeral `cart_items`/`wishlist_items` rows; `store_reviews`/`review_media`/`order_items` are left untouched since the product row (and its history) survives. Every other cross-table reference in this contract (`orders.user_id`, `order_items.order_id`/`product_id`, `store_reviews.user_id`/`order_id`, `review_media.review_id`, `review_media_uploads.user_id`, `product_variants.product_id`, `product_media.product_id`, `addresses.user_id`, `password_reset_tokens.user_id`, `filter_options.parent_id`) is also a real FK now — none of the "no DB-level FK" language elsewhere in this file is current.

### Product soft-delete & Cloudinary recycle bin

`products.deleted_at` (nullable `TimestamptzString`) is a soft-delete marker — `deleteProductService` never row-deletes `products`; it stamps `deleted_at` and clears `is_published`. Every read service (`listPublishedProductsService`, `getPublishedProductBySlugService`, `listAdminProductsService`, `getAdminProductService`) and the slug/sku uniqueness checks in `createProductService`/`updateProductService` filter `deleted_at: null`. `slug`/`sku` are no longer plain `@unique` — they're **partial unique indexes** (`@@index([slug], unique: true, where: "(deleted_at IS NULL)", ...)`, same for `sku`) scoped to active rows only, so a soft-deleted product's slug/sku can be reused by a new product.

`product_variants`/`product_media`/`product_reviews`/`review_media` rows are **not** deleted alongside a soft-deleted product — they stay for audit/history.

**Cloudinary assets are never destroyed.** "Deleting" one moves it to `<root>/recycle-bin/<original path>` (e.g. `store/product/abc` → `store/recycle-bin/product/abc`) so a wrong delete is recoverable — restore by renaming it back. Best-effort, never blocks the write. **Every removal in the app must go through `moveToRecycleBin`/`moveToRecycleBinByUrl` in `cloudinary.util.ts` — never call `uploader.destroy` directly.** The bin is not auto-purged (no retention job); it grows until you clear it in the Cloudinary console.

- `deleteProductService` recycles every `product_media` row's asset before stamping `deleted_at`.
- `writeVariantsAndMedia` (called from `updateProductService`) diffs the old vs. new media list on every edit and recycles only the URLs actually dropped from the gallery — reused images are left alone.
- `cloudinary.util.ts`: `publicIdFromUrl(url)` derives the `public_id` from an unsigned upload URL (no transformations are ever applied at upload, so this is reliable); `moveToRecycleBin(publicId, resourceType?)` / `moveToRecycleBinByUrl(url, resourceType?)` wrap `uploader.rename(…, { overwrite: false, invalidate: true })` in try/catch and log on failure instead of throwing — same fail-open convention as the Redis cache. `recycleBinPublicId()` is idempotent (an already-binned id is never nested). Also used by `deleteReviewMediaService`, the stale-upload cron, and replacing the payment QR. Binned assets stay public-type; they are only reachable by their (random) URL. Self-check: `pnpm tsx scripts/check-recycle-bin.ts`.

Not every resource is ownership-enforced — `contact_messages` is a deliberate exception: it's a public write with no `authenticate` middleware and no `user_id` column, since submitters are not required to be signed in.

ORM list pattern (`.all()` terminal + function-style `orderBy`):

```ts
// correct
const rows = await db.orm.public.addresses
  .where({ user_id: userId })
  .orderBy((a) => a.created_at.desc())
  .all();

// correct — single row
const row = await db.orm.public.addresses.where({ id: addressId }).first();
```

### Adding a new domain (example: `product`)

1. Add shared types to `packages/contracts/src/product.ts`; re-export from `src/index.ts`.
2. Add Zod schemas to `packages/contracts/src/schemas/product.schema.ts`; re-export from `src/index.ts`.
3. Add a `model products { ... }` block to `src/prisma/contract.prisma`.
4. Run `pnpm prisma contract emit` then `pnpm prisma db update`.
5. Create `src/routes/product.route.ts` — declare routes, attach middleware where needed.
6. Create `src/controllers/product.controller.ts` — Zod `safeParse` + call service.
7. Create `src/services/product.service.ts` — use `db.orm.public.products.*` only.
8. Register in `src/index.ts`: `app.use("/api/v1/products", productRouter)`.
9. **Update this file** to reflect the new domain and any new conventions.

### Products & reviews API (implemented)

- `GET /api/v1/products` / `GET /api/v1/products/:slug` — public, published-only reads (`product.route.ts`).
- `/api/v1/admin/products` (`authenticateAdmin`) — full CRUD, separate mount path from `/:slug` to avoid route collision (`admin-product.route.ts`).
- `POST /api/v1/reviews` (`authenticate`) / `GET /api/v1/reviews` (public) — reviews are store-wide (`store_reviews` has no `product_id`), gated in `review.service.ts`: creation requires an `orders` row (`orderId` in the payload) owned by the caller with `status === "delivered"`. Uniqueness is `(user_id, order_id)` — **one review per order**, however many products it contains. There is no separate "can I review" check endpoint — the create call itself 403s/409s if unverified/already reviewed.
- `orders`/`order_items` are intentionally minimal — no checkout/payment endpoints exist yet, and there's no "my orders" listing either. The web form collects the order reference directly (from the order confirmation) rather than letting the user pick from a list; wire that up once a real checkout/order-history flow exists.
- `products.rating_avg`/`rating_count` were dropped — they were never written to, since reviews are store-wide, not per-product. `Product.rating`/`ProductDetail.reviewCount` in the contract types are kept for the storefront's existing star-rating UI but are now hardcoded to `0` in `rowToProduct`/`rowToProductDetail` (`product.service.ts`) — there is no per-product rating data source.
- **Review media uploads** reuse the existing validated pipeline (`file-upload.util.ts`/`cloudinary.util.ts`/`media.service.ts`) instead of a new one: `POST /api/v1/media/review-upload` (image) / `POST /api/v1/media/review-upload-video` (video), both `authenticate` (not admin) and hardcode `category: "review"` server-side so a shopper can never write into another Cloudinary folder — the same mimetype allowlist, `sharp` decode/dimension validation, and size caps as the admin upload endpoints apply. `DELETE /api/v1/media/review-upload` (body `{ url }`) deletes a Cloudinary asset, restricted server-side to URLs whose `public_id` falls under the `review` folder (`deleteReviewMediaService` in `media.service.ts`). The frontend uploads on file-select (before form submit) and stores the returned URL in the review payload's `media[]`; removing an attachment client-side also calls the delete endpoint.
- **Upload security, layered (not just a mimetype header check):**
  1. `multer`'s `fileFilter` — cheap, client-supplied, spoofable reject on declared mimetype.
  2. Images: `compressImage()` decodes with `sharp` — anything that isn't a real, decodable image throws `422`, which also catches an extension/mimetype mismatch. Re-encoding to webp strips all EXIF/GPS/XMP metadata as a side effect.
  3. Videos: `sharp` can't decode video, so `assertRealFileType()` (`file-upload.util.ts`, backed by the `file-type` npm package) sniffs the real file signature and rejects anything whose detected mime isn't in `ALLOWED_VIDEO_MIME_TYPES`, before the buffer ever reaches Cloudinary. The same helper also runs at the top of `compressImage()` as a cheap extra check for images, ahead of the (stronger) sharp decode. Cloudinary's own `resource_type: "video"` upload re-validates on top of that.
  4. Every upload is memory-buffered (`multer.memoryStorage()`) — never written to disk — and Cloudinary assigns the `public_id` (`unique_filename: true, use_filename: false`), so the caller's filename is never trusted as a path component.
  5. **Ownership on delete**: `review_media_uploads` records `(user_id, url)` at upload time, before the file is attached to any review. `deleteReviewMediaService` 403s unless the row's `user_id` matches the caller — a signed-in user can only delete their own uploads, not any review-folder URL they can guess. `createReviewService` cross-checks the payload's `media[]` URLs against this same table (owned by the caller) before attaching them to the new review, and deletes the now-consumed rows.
  6. All three review-related mutation routes (`POST /reviews`, `POST /media/review-upload(-video)`, `DELETE /media/review-upload`) require `authenticate` — there is no anonymous path to write a review or upload/delete media.
  7. **Orphaned uploads**: a user can upload media then abandon the review form (close tab/navigate away) — the file stays in Cloudinary + `review_media_uploads` with no review ever attached. `cleanupStaleReviewMediaUploadsService()` (`media.service.ts`) purges any `review_media_uploads` row older than 24h (a row is deleted once it's either attached via `createReviewService` or swept by this job — never both). Scheduled with `node-cron` in `index.ts` (`cron.schedule("0 3 * * *", ...)` — daily at 3am), not a request path. `ponytail:` in-process schedule, single-instance only — move to a hosted cron/queue hitting an internal endpoint if the API ever scales to multiple instances (otherwise every instance fires it).
- Media categories `"product"` and `"review"` were added to `MEDIA_CATEGORIES` (`media.schema.ts`) so the existing Cloudinary upload pipeline (`media.route.ts`/`cloudinary.util.ts`) covers product and review uploads without new endpoints.

### Admin-managed shop filters (implemented) — DB-backed, not JSON

The web storefront's shop filter panel (`apps/web/components/shop/filters-panel.tsx`) computes its facets dynamically from live product data (`apps/web/lib/shop/params.ts`'s `FacetKey = "category" | "surface" | "size" | "brand" | "colour" | "gender"`, built in `apps/web/lib/shop/query.ts`) — it needs **no code change** to pick up new filter values. What actually makes a facet "admin-managed" is making its underlying product/variant field draw from a controlled vocabulary instead of free text, so values stay consistent (`"Sneaker"` never splits from `"sneakers"`).

Five of the six facets are admin-managed this way, via a single `filter_options` table with a `kind` discriminator (`FILTER_OPTION_KINDS` in `packages/contracts/src/filter-option.ts`):

| Facet     | `kind` value | Backing column                                                                                                                                                                           |
| --------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Category  | `category`   | `products.category`                                                                                                                                                                      |
| Brand     | `brand`      | `products.brand`                                                                                                                                                                         |
| Surface   | `surface`    | `products.surface`                                                                                                                                                                       |
| Size      | `size`       | `product_variants.size`                                                                                                                                                                  |
| Colour    | `colour`     | `product_variants.color_name`                                                                                                                                                            |
| Condition | `condition`  | `products.condition_id` (real FK → `filter_options.id`, not a slug; admin picks it on the product form, storefront cards show its name; deleting one used by a live product returns 409) |

**`gender` is deliberately excluded.** It's a fixed 3-value Zod enum (`z.enum(["Men", "Women", "Kids"])` in `createProductSchema`) on `products.gender`, not an open vocabulary — slugifying it and routing it through `filter_options` would break that enum validation for no benefit (the value set will not grow). It stays a hardcoded 3-option `<Select>` in the admin product form.

**API:**

- `GET /api/v1/filter-options` (public) — returns every kind at once (small list, no pagination). `GET|POST /api/v1/admin/filter-options`, `PATCH|DELETE /api/v1/admin/filter-options/:id` (`authenticateAdmin`) — `POST` body is `{ kind, name, parentId? }`; `PATCH` body is `{ name, parentId? }` (kind is immutable — delete and recreate under a different kind instead).
- Stored in `filter_options` (`filter-option.service.ts`), not a JSON file — see "Why DB over a JSON file" below.
- Each row's `slug` is unique **per kind** (`@@unique([kind, slug])`) — `"gold"` can exist once as a `colour` and once as a `size` label without colliding.
- `products.category`/`brand`/`surface` and `product_variants.size`/`color_name` store the option's `slug` as free text — deliberately **not** FK'd to `filter_options.slug` (the slug is duplicated per `kind`, not a stable single-column key, and orphaning on delete is desired here). Deleting a filter option does **not** cascade to products/variants — existing rows keep their (now orphaned) value; they just stop appearing in the admin picker for new/edited rows. `filter_options.parent_id` itself _is_ a DB-level FK (self-reference).

**Subcategories:** `filter_options.parent_id` is a nullable self-reference, **only meaningful for `kind = "category"`** — it makes a row a subcategory of the row it points to (one level deep; nothing stops a deeper chain in the data model, but the admin UI only ever builds/renders one level). `createFilterOptionService` rejects `parentId` on any other kind (422) and 404s if the referenced parent doesn't exist or isn't itself a category. Deleting a parent category does **not** cascade to its subcategories — they become orphaned top-level-shaped rows (still `kind: "category"`, now with a dangling `parentId`) rather than being deleted, same "orphan, don't cascade" convention as the rest of this table.

**Admin UI — dedicated page (`apps/admin/src/app/filters/page.tsx`, route `/filters`, sidebar "Shop Filters"):**

- All five kinds are managed from one page, not from the products page — `CategoriesSection` renders the category tree (top-level rows as a table, each with its subcategories nested underneath and its own inline "add subcategory" form); `FlatFilterSection` renders once per remaining kind (brand/surface/size/colour) as a flat table.
- Every row (`OptionRow` for top-level rows and flat kinds, `SubcategoryActions` for subcategory rows) has inline rename (pencil → input + Save/Cancel, calls `PATCH /api/v1/admin/filter-options/:id`) and delete (calls `DELETE /api/v1/admin/filter-options/:id`).
- The admin product form (`apps/admin/src/app/products/page.tsx`) still reads these lists via `useFilterOptionsByKind` to populate its Category/Brand/Surface `<Select>`s, but no longer has any create/edit/delete UI of its own — a "Manage filters" button links to `/filters` instead. The Category select is flat (parents and subcategories both selectable, undifferentiated) — a product's `category` can be set to either a top-level category or a subcategory's slug.
- Size/Colour are curated the same way, and the admin product form's variants editor (`VariantsEditor` in `apps/admin/src/app/products/page.tsx`) pulls its size/colour dropdowns from these lists (stores the option `slug` in `product_variants.size`/`color_name`; picking a colour autofills `color_hex` from `filter_options.hex`, which is set per colour on the Filters page; a saved value whose option was deleted shows as "<slug> (removed)" and is kept until changed).

**Why DB over a JSON file:** this list is edited at runtime by admins (adding a brand should not require a deploy), and it's read on every `/shop` page load — a JSON file would need a code deploy per edit and doesn't compose with the Redis cache below. A dedicated table plus a cache in front of it gets both: instant admin edits and cheap reads.

### Redis cache (read-through, fail-open)

- `src/utils/redis.util.ts` wraps `ioredis` — `cacheGet`/`cacheSet`/`cacheDel`. Every call is wrapped in try/catch and returns a miss/no-op on any Redis error, including "not connected" — **the API must never fail a request because Redis is down.**
- `config.redisUrl` / `config.cacheTtlSeconds` (`REDIS_URL`, `CACHE_TTL_SECONDS`, default 300s). `config.cacheLongTtlSeconds` (`CACHE_LONG_TTL_SECONDS`, default 86400s) is for rarely-edited data invalidated on every write: page content (`content:<key>`), payment details (`content:payment`), filter options.
- Cached keys: `products:published` (the unfiltered published-products list — the one hit on every `/shop` load) and `filter-options:all` (every managed filter option, all kinds, one list). Both are invalidated (`cacheDel`) on every write to their respective table (product create/update/delete; filter option create/delete).
- Do not cache filtered/paginated reads or anything user-owned (cart, wishlist, addresses) — only public, read-heavy, rarely-written lists belong in this cache.

### What not to do

- Do not call `res.json()` directly — use `sendSuccess` / `sendError`.
- Do not throw `Object.assign(new Error(...), { statusCode })` — use `createHttpError`.
- Do not read `process.env` directly in services/controllers — use `config` from `src/config.ts`.
- Do not hardcode TTLs, cookie names, salt rounds, or URLs — all tunables live in `config.ts` + `.env`.
- Do not define Zod schemas inside `apps/api/src/` — they live in `packages/contracts/src/schemas/`.
- Do not write raw SQL — use `db.orm.public.<model>.*` from `src/prisma/db.ts`.
- Do not instantiate a new Prisma client — import the `db` singleton from `../prisma/db.js`.
- Do not import `db` from `utils/db.util.ts` — that file is dead; the client is at `../prisma/db.js`.
- Do not call `new Date()` in a service — use `nowUtc()` from `datetime.util.ts`.
- Do not return `password_hash` to the client — `AuthUser` type intentionally omits it.
- Do not use `interface` — use `type`.
- Do not put business logic in a route or controller — services only.
- Do not put Express types (`Request`, `Response`) in a service.
- Prefer running `pnpm prisma contract emit` to regenerate `contract.json` and `contract.d.ts`; hand-editing is acceptable when the CLI is unavailable but requires updating all three contract files (`contract.prisma`, `contract.d.ts`, `contract.json`) atomically and running `tsc --noEmit` to confirm type correctness.
- Do not use verb phrases in URL segments — use nouns or single-word action names.
- Do not instantiate `Resend` directly — use `sendPasswordResetEmail` from `email.util.ts`.
- Do not reveal whether an email is registered in `forgot-password` responses — always return 200.
- Do not store raw reset tokens in the DB — store only the SHA-256 hash.
- **Do not finish a task without updating this file.**

### Orders, JazzCash payment & stock (oversell guard)

**Flow:** the customer pays via JazzCash (QR + account + support phone shown on the storefront checkout, **admin-editable**, stored in the singleton `payment_settings` table (id `"default"`, not a file, so it survives redeploys and is shared across instances) and served by `GET /content/payment`, edited via `PUT /content/payment` from the admin "Payment Details" page. No row / empty account number = "payments not set up": checkout shows a notice and `placeOrderService` throws 503; replacing the QR moves the old Cloudinary asset to the recycle bin), uploads the screenshot to `POST /api/v1/media/payment-upload` (authenticated, category hardcoded to `payment`), then calls `POST /api/v1/orders` with `placeOrderSchema` (`idempotencyKey`, contact, shipping address snapshot, `shippingMethod`, `paymentScreenshotUrl`). The order is created as `pending` (= awaiting payment verification) and a "payment received, verifying" email is sent. An admin reviews it in the admin **Orders** tab: `PATCH /orders/admin/:id/confirm` → `processing` + "order accepted" email; `PATCH /orders/admin/:id/cancel` → `cancelled` + stock returned (only from `pending`/`processing`); `PATCH /orders/admin/:id/status` `{ status: "shipped" | "delivered" }` moves `processing → shipped → delivered` (delivered is what unlocks a customer's store review). `GET /orders/admin` lists everything (admin JWT). Status transitions are compare-and-set on the current status (`transition()`), so a double-click can't send the email or restock twice.

**Idempotency:** `orders` has a unique `(user_id, idempotency_key)`. `placeOrderService` returns the existing order for a repeated key, and also recovers from the unique-violation race between two concurrent requests (the losing transaction rolls back, stock included).

**Payment proof:** `paymentScreenshotUrl` must be a screenshot the _same user_ uploaded via `/media/payment-upload` (`assertOwnPaymentProof`). Uploads are recorded in `review_media_uploads` (same shape as review uploads — despite the name it is the generic "uploaded but not yet attached" table); `placeOrderService` deletes the row when the screenshot is attached, and the existing daily cron recycles rows (+ moves the Cloudinary asset to the bin) older than 24h that never were. There is no server-side check that the image is a genuine JazzCash receipt — the admin verifies the payment in their own JazzCash app. The admin drawer shows an **advisory-only** OCR hint panel (see `apps/admin/README.md`); the public storefront never runs OCR.

**Totals:** `total_price` = items + `shipping_cost`, in PKR; shipping comes from `shippingCostMinor()` in `@ecommerce/contracts` (shared with the web summary; current values Rs 250 / 500 / 800, standard free over Rs 10,000 — edit `shipping.ts`). Displayed amounts and email totals use `formatMoney()`. Money is summed in integer minor units, never floats.

**Stock:** lives only on `product_variants.stock`, and **every sellable product must have ≥1 variant row** — a plain product is one variant with null size/color (the admin form's "Stock" field writes it). A product with no matching variant row counts as sold out. Variants are reconciled **in place** by `writeVariantsAndMedia` (matched by id, else size+color; rows missing from the payload are deleted). The admin form sends `stock` plus the `baseStock` it loaded, and the server applies `stock − baseStock` to the _current_ stock via `adjustStock` (clamped at 0) — so an admin save can never overwrite units sold while the form was open; without `baseStock` (create/API clients) `stock` is absolute. `order_items` still matches variants on product+size+color rather than an id (cancel/restock does the same). Each variant is decremented with a compare-and-swap (`adjustStock` in `stock.service.ts`: `UPDATE … WHERE id = … AND stock = <read>`, up to 3 retries) because the SQL builder can't express `stock = stock - n`. Any sold-out / short / unpublished line throws a **409** with `errors: [{ field: <productId>, message }]` (the global error handler forwards `err.errors`) and the whole transaction rolls back. `GET /cart` returns `availableStock` per line (0 = sold out, unpublished/deleted, or no matching variant) so the storefront shows "Sold out" / "Only N left" and disables checkout.

**Emails:** both order emails take `supportPhone` from the payment content JSON at send time (no env var).

### Rate limiting, security headers & proxy

`index.ts` applies `helmet()` (with `crossOriginResourcePolicy: cross-origin` — this is a cross-origin JSON API) and a baseline `globalLimiter` (300 req/min/IP). `middleware/rate-limit.middleware.ts` defines stricter per-route limiters: `authLimiter` (20 / 15 min — user + admin login, register, forgot/reset password), `uploadLimiter` (40 / h — customer uploads), `orderLimiter` (10 / 10 min — `POST /orders`), `contactLimiter` (10 / h). Blocked requests get the standard `429` error envelope. **Set `TRUST_PROXY_HOPS`** to the number of reverse-proxy hops in front of the API (0 = direct), otherwise every client shares the proxy's IP; the server warns at startup in production when it is 0. Counters are in-memory per instance (`ponytail:` — N instances allow N× the limit; swap in a shared store over the existing ioredis client if scaled out). `RATE_LIMIT_DISABLED=true` turns limiting off for tests/load runs only.

### Tests

`pnpm test:integration` runs `tests/*.test.ts` (Node's built-in runner via tsx) against a **real Postgres**: `TEST_DATABASE_URL=postgres://…/ecommerce_scratch_test pnpm test:integration`. The database must already have the schema (`DATABASE_URL=<that url> pnpm prisma db migrate`) and its name must contain `test` or `scratch` — the suite refuses to run otherwise because it creates users/products/orders. Email is forced into dev/stdout mode. Covered: two buyers for the last unit, concurrent double-click idempotency, variant-less products unsellable, cancel/restock exactly once, confirm once-only + fulfilment transitions, admin edits never overwriting sold stock. Also run before a release: `DATABASE_URL=<empty scratch db> pnpm prisma db migrate && pnpm prisma db verify` to prove the migration files alone rebuild the schema.

### Deploy checklist (API)

`DATABASE_URL`, JWT secrets, `CLOUDINARY_*`, a **valid `RESEND_API_KEY` with a verified sender domain** (else customer emails are not sent — the server warns), `TRUST_PROXY_HOPS`, `FRONTEND_URL`, and CORS origins in `index.ts`. Run `pnpm prisma db migrate` (never `db update`) against production. Fill in payment details in the admin "Payment Details" page before opening checkout. Shipping prices are placeholders in `packages/contracts/src/shipping.ts`. The daily cleanup cron is in-process (single instance only). Payment screenshots are stored at public (unguessable) Cloudinary URLs.

### Page content (`site_content`)

The five admin-editable pages (home, about, contact, blog, condition guide) are stored in the `site_content` table — one row per page (`key`, `data Json`, `updated_at`) — never on disk, so edits survive redeploys/container recreation and are shared by every instance. `content.service.ts` reads/upserts the row; there are **no on-disk defaults** — an unseeded page answers `404` ("Run `pnpm seed:content`"), and the storefront pages that need it will fail until seeded.

**Seeding:** `pnpm run seed:content` (`scripts/seed-content.ts`) loads `scripts/seed-data/*.json`, validates **every** file with its Zod schema from `@ecommerce/contracts` _before writing anything_, then inserts only the pages that don't exist yet — so it is safe to run on every deploy and never overwrites admin edits. `pnpm run seed:content -- --force` overwrites all pages with the seed data (use to reset). `seed-data/` is seed input only: it is not read at runtime and not shipped in `dist/`. **Run `pnpm prisma db migrate` then `pnpm seed:content` on every new environment.** To change the initial copy, edit `scripts/seed-data/*.json` and re-seed with `--force` (this discards admin edits to those pages). Payment details use the same DB approach in `payment_settings` (filled in the admin, no seed). Tests: `tests/content.integration.test.ts`.

### ORM pitfall: `.delete()` removes ONE row

In this Prisma 8 build `.where(...).delete()` deletes **exactly one row even when many match** (it returns that row). Use `.where(...).deleteAndCount()` for anything that can match more than one row (clearing a cart/wishlist, removing all of a user's tokens, `in([...])` lists, replacing a gallery, removing a product from every cart). Plain `.delete()` is only correct when the filter is a unique key (id, unique url, unique user+product). `.update()` has the same single-row shape — every current call targets a unique key. `tests/multirow.integration.test.ts` guards this.

### Product variants are fully specified

`product_variants.size`, `color_name`, `color_hex` are NOT NULL (and required in `productVariantSchema`, `variants` min 1). Carts/orders match a variant on (size, colour) via `findVariant` in `stock.service.ts`; a line missing size/colour still resolves only when the fields present narrow to exactly one variant. The admin colour picker derives `color_name` from the hex with `color-namer` (CSS names) in `apps/admin/src/lib/color-name.ts`. `salePrice` is optional — forms must send `undefined`, never `""`. Checks: `pnpm tsx scripts/check-product-schema.ts`, `scripts/check-find-variant.ts`.

### Order shipping address is a JSON snapshot

`orders.ship_address` (Json, NOT NULL) holds the shared `Address` shape written by `placeOrderService` (`shipAddress()` copies only the known fields; `line2` omitted when empty). It replaced seven flat `ship_*` columns because it is a write-once snapshot that is never queried by field; adding an address field needs no migration. Read it with `o.ship_address as Address`. Migrations `…_order_ship_address_json_add` (backfill via `rawSql`) and `…_finalize` (NOT NULL, then drop the old columns) — if you ever need to filter orders by city/postcode, use a JSON path or add a generated column.

### Admin list endpoints filter in SQL

`GET /orders/admin`, `/admin/products`, `/contact` take `status`, `q`, optional `from`/`to` (ISO instants; the admin sends local-day boundaries via `lib/date-range.ts`), page `limit`/`page`, and return `paginationMeta`; each has a sibling `/counts` (one GROUP BY) for tab badges and sidebar badges. Products add `category`, `brand`, `conditionId`, `stock` (in/low/out, `LOW_STOCK_THRESHOLD`), `onSale`, `sort`; orders add `shippingMethod` and `sort`. `GET /admin/filter-options/usage` maps option id → product count. Never filter or page these lists in the browser. The admin date picker is the shadcn Popover + Calendar range picker (`components/date-range-picker.tsx`, base-ui `render` instead of Radix `asChild`).

### Security conventions

- CORS is an exact-match allowlist from `CORS_ORIGINS` (never `*`; credentials are on). Set it, `TRUST_PROXY_HOPS`, and `NODE_ENV=production` before deploying; production boot refuses weak/identical JWT secrets.
- Refresh tokens are revoked on logout and password reset via `utils/token-revocation.util.ts` (Redis "revoked before" stamp; fails open if Redis is down). Refresh/login routes have `refreshLimiter` / `loginAccountLimiter`.
- Login always runs a bcrypt compare (dummy hash) so timing doesn't reveal registered emails. JWT verify pins `HS256`.

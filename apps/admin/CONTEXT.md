# Admin — React admin panel

Vite + React 19 + TypeScript + shadcn/ui single-page admin for the store (port 5173). It talks only to `apps/api` through the `/api/v1/admin/*` routes and signs in with its own admin account, JWT secret and refresh cookie (separate from customers).

> **Keeping this current:** after a change that alters routes, env vars, patterns or rules, update this file (and the root `AGENTS.md` if it affects the whole repo). It is the single source of context for contributors and AI coding agents working in `apps/admin`.

## Part 1 — Overview and reference

### Run and build

```bash
pnpm dev --filter admin        # http://localhost:5173 (copies the OCR assets first)
pnpm build --filter admin      # tsc -b + vite build -> dist/ (static files)
pnpm check-types --filter admin
```

Environment (`apps/admin/.env`, public — bundled into the browser, never put secrets here):

- `VITE_API_URL` — base URL of the API (default `http://localhost:4000`).

The API must list this app's origin in `CORS_ORIGINS`. The static `dist/` needs security headers from its host: see `DEPLOYMENT.md`.

### Branding

The admin name, logo and HTML title come from `packages/contracts/src/branding.json` (`displayName`, `adminTitle`, `logo`). `vite.config.ts` fills `%DISPLAY_NAME%` / `%ADMIN_TITLE%` in `index.html` at build time. Never hardcode a store name.

### Project structure

```
src/
  App.tsx, main.tsx       router shell; routes are the AdminRoute union in lib/routes.ts
  app/<feature>/          one folder per admin page: dashboard, products, orders,
                          payment, filters, messages, content (home/about/contact/blog/condition-guide)
  components/             shared UI (ui/ = shadcn primitives), auth/, orders/, messages/, content/
  lib/
    api/                  axios client + one *.api.ts per resource
    hooks/                React Query hooks
    store/                Zustand: admin-auth (persists `user` only), toast
  providers/              React Query provider
scripts/
  copy-tesseract-assets.mjs   copies the OCR runtime into public/tesseract/ (gitignored)
  check-payment-proof-hints.ts
```

### Auth

- Login hits `POST /api/v1/admin/auth/login`; the access token is kept **in memory** (Zustand, only `user` is persisted to localStorage) and the refresh token is an HttpOnly cookie scoped to `/api/v1/admin/auth/refresh`.
- `lib/api/axios.ts` attaches `Authorization: Bearer <token>` and, on a 401, silently refreshes once and retries (concurrent 401s queue behind one refresh). After a page reload the first request refreshes the token this way.
- Logout calls the API, which revokes the admin's refresh tokens.

### Orders & advisory payment check

The **Orders** tab lists orders (status tabs + search) and opens a drawer with the fulfilment actions (Confirm → Mark shipped → Mark delivered, or Cancel & restock) and with the customer's JazzCash screenshot. For `pending` orders the drawer also shows an **advisory-only** OCR panel (`components/orders/payment-proof-advisory.tsx`): `tesseract.js` runs **in the admin's browser** (lazy-loaded; no server CPU; result cached per order for the session). The OCR runtime — worker, wasm core and English language data — is **self-hosted**: `scripts/copy-tesseract-assets.mjs` copies it from `node_modules` into `public/tesseract/` (gitignored, ~13MB, run automatically before `dev` and `build`), so there is no third-party CDN at runtime. Worker/core/lang URLs must be absolute (the worker runs from a blob) and `lib/payment-proof-hints.ts` looks for "JazzCash", the order amount, your account number (last 10 digits) and a transaction id. "Not found" never means fake — OCR misses text. The admin verifies the payment in their own JazzCash app and then confirms; OCR never confirms or rejects anything. Self-check: `pnpm tsx ../admin/scripts/check-payment-proof-hints.ts` from `apps/api`.

## Part 2 — Engineering conventions

- **Shared types and Zod schemas come from `@ecommerce/contracts`.** Never redefine them here. Format money with `formatMoney()`.
- **Branding is data.** Use `branding` from `@ecommerce/contracts`; no hardcoded store names.
- **Data fetching** goes through `lib/api/*.api.ts` + React Query hooks in `lib/hooks`; components don't call axios directly.
- **Forms** use React Hook Form with the shared Zod schemas via `@hookform/resolvers`.
- **UI** is shadcn/ui (`components/ui`); add components with `npx shadcn@latest add <name>`. Style with Tailwind tokens, not raw colors.
- **Never persist tokens** in localStorage/sessionStorage. Keep the access token in memory only.
- **No `dangerouslySetInnerHTML`** with user-controlled data.
- Run `pnpm lint` and `pnpm check-types` before committing.

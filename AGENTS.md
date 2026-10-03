# AGENTS.md — monorepo-wide conventions

Read this first. Each app has a `CONTEXT.md` (overview, reference and conventions) plus a `CLAUDE.md` that imports it — read it before writing code in that app.

- `apps/web/CONTEXT.md` — Next.js storefront (Zustand stores, component patterns, styling).
- `apps/api/CONTEXT.md` — Express/Prisma backend (conventions + API reference).
- `apps/admin/CONTEXT.md` — Vite/React admin panel.

## Structure

```
apps/
  web/          Next.js 16 storefront (port 3000)
  admin/        Vite + React admin panel (port 5173)
  api/          Express 5 + Prisma 8 API (port 4000)
packages/
  contracts/    @ecommerce/contracts — shared types, Zod schemas, branding.json, money/shipping helpers
  ui/           @repo/ui — shared component stubs
  eslint-config/, typescript-config/
```

## Rules that apply everywhere

- **Money is PKR** (customers pay via JazzCash). Never hardcode a currency symbol — format every displayed amount with `formatMoney()` from `@ecommerce/contracts`. The prefix is `"Rs "` on purpose (no `.`): the storefront parses price strings with `/[^0-9.]/g`. Shipping prices and the free-shipping threshold live only in `packages/contracts/src/shipping.ts` (`shippingCostMinor`, integer paisa) — the API totals orders with it and the web displays it; never duplicate those numbers locally.
- Shared domain types and Zod validation schemas live in `@ecommerce/contracts`. Never redefine or duplicate one locally in `apps/web`, `apps/admin` or `apps/api`.
- Use `pnpm --filter <app>` (or `turbo run <task> --filter=<app>`) to scope commands to one app; plain `pnpm <script>` at the root runs it for every app/package via Turborepo.
- **Branding is data, not code.** The store name/logo/description live in `packages/contracts/src/branding.json` (`branding` from `@ecommerce/contracts`) and are used by web, admin and API emails. Never hardcode the store name in any app.
- **Meta-rule:** after a task changes architecture, conventions, or anything a future session needs to know to work in this repo, update the relevant `CONTEXT.md` / `README.md` / `AGENTS.md` (root and/or app-level). Routine feature work that doesn't change those doesn't need a doc update.

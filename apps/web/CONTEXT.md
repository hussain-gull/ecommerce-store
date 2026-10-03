# Web — Next.js storefront

Customer-facing Next.js 16 storefront (port 3000). Reads data from the API; copy and branding come from JSON files.

> **Keeping this current:** after a change that alters routes, env vars, patterns or rules, update this file (and the root `AGENTS.md` if it affects the whole repo). It is the single source of context for contributors and AI coding agents working in `web`.

## Part 1 — Overview and reference

The customer-facing storefront for the ecommerce platform. A Next.js 16 App Router application styled with Tailwind CSS v4 and animated with Framer Motion.

---

### Project overview

This is a footwear and fashion ecommerce storefront (store name set in `packages/contracts/src/branding.json`). The `@web` app is the public-facing frontend. It reads all product, page-content and account data from the `@api` backend (Express 5, port 4000).

### Technology stack

| Layer         | Technology                                  |
| ------------- | ------------------------------------------- |
| Framework     | Next.js (App Router)                        |
| Language      | TypeScript                                  |
| Styling       | Tailwind CSS v4                             |
| Animations    | Framer Motion                               |
| Smooth scroll | Lenis                                       |
| Icons         | lucide-react                                |
| React         | React 19                                    |
| Server state  | TanStack Query (React Query)                |
| Client state  | Zustand                                     |
| Forms         | React Hook Form + Zod resolver              |
| HTTP client   | Axios                                       |
| Validation    | Zod 4 (schemas from `@ecommerce/contracts`) |
| Monorepo      | Turborepo + pnpm workspaces                 |

### Monorepo context

```
ecommerce/
├── apps/
│   ├── web/          ← this app (port 3000)
│   └── api/          ← backend (port 4000)
└── packages/
    ├── contracts/    ← shared types AND Zod schemas (@ecommerce/contracts)
    ├── ui/           ← shared UI primitives (@repo/ui)
    ├── eslint-config/
    └── typescript-config/
```

All shared domain types **and** Zod validation schemas come from `@ecommerce/contracts`. Never duplicate or redefine them locally.

### Environment

Create `apps/web/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

(`apps/web/.env.example` has both.)

The API runs on port 4000. The web dev server runs on port 3000. Both must be running for auth to work.

### Running

```bash
# From monorepo root — start everything
pnpm dev

# Or individually
pnpm dev --filter web   # Next.js on http://localhost:3000
pnpm dev --filter api   # Express on http://localhost:4000
```

### Routing structure

All routes are under `app/`. Pages are Server Components by default.

| Route              | File                           | Description                                                                                                                                                                                          |
| ------------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                | `app/page.tsx`                 | Home page (hero, promotions, featured products)                                                                                                                                                      |
| `/shop`            | `app/shop/page.tsx`            | SSR first load; filters run client-side and sync to the URL (see "Shop filters" below)                                                                                                               |
| `/products/[slug]` | `app/products/[slug]/page.tsx` | Product detail — SSR from `/api/v1/products/:slug` (`dynamic = "force-dynamic"`), rich SEO metadata + Schema.org JSON-LD, autoplay gallery + full-screen lightbox, size/colour picker, tabs, related |
| `/about-us`        | `app/about-us/page.tsx`        | Brand story, stats, values, team                                                                                                                                                                     |
| `/contact-us`      | `app/contact-us/page.tsx`      | Contact info + validated form                                                                                                                                                                        |
| `/login`           | `app/login/page.tsx`           | Sign-in — RHF + TanStack Query, backend errors mapped to fields                                                                                                                                      |
| `/signup`          | `app/signup/page.tsx`          | Account creation — same stack                                                                                                                                                                        |
| `/account`         | `app/account/page.tsx`         | Account dashboard — overview, orders, addresses, profile                                                                                                                                             |
| `/wishlist`        | `app/wishlist/page.tsx`        | Saved products with grid/list toggle; remove, clear, and cart actions                                                                                                                                |
| `/cart`            | `app/cart/page.tsx`            | Cart items, qty controls, order summary                                                                                                                                                              |
| `/checkout`        | `app/checkout/page.tsx`        | Checkout — manual JazzCash payment with screenshot upload (see "Checkout & JazzCash payment")                                                                                                        |

### Project structure

```
apps/web/
├── app/
│   ├── layout.tsx              # Root layout — QueryProvider, ToastContainer, font, Lenis
│   ├── globals.css             # Tailwind v4 @theme tokens + base body styles
│   └── [routes]/page.tsx       # One Server Component page per route
├── components/
│   ├── layout/                 # TopBar, Header, Footer, Breadcrumb, dropdowns
│   │   └── top-bar.tsx         # Cart + wishlist badge counts from Zustand stores
│   ├── animated-home/          # Home page (copy + products come from the API)
│   ├── product/
│   │   ├── product-card.tsx    # Hover bar: wishlist toggle, add-to-cart, quick-view; image links to detail page
│   │   ├── detail/
│   │   │   ├── product-gallery.tsx  # Left thumb rail, 4 s autoplay (pauses on hover), arrows, discount badge, full-screen trigger
│   │   │   └── lightbox.tsx         # Portalled full-screen viewer: counter, zoom, native full screen, share, arrows, thumb strip
│   │   ├── list-card.tsx       # List-view product row with add-to-cart and wishlist toggle
│   │   └── product-grid.tsx    # Grid + list layout switcher
│   ├── auth/
│   │   ├── login-form.tsx      # RHF + zodResolver + useLogin mutation; wiggle on error
│   │   └── signup-form.tsx     # RHF + zodResolver + useSignup mutation; wiggle on error
│   ├── account/                # Dashboard panels (overview, orders, addresses, profile)
│   ├── wishlist/
│   │   ├── wishlist-page.tsx   # Full wishlist UI — grid/list toggle, GridCard, ListRow, empty state, bottom strip
│   │   └── wishlist-item.tsx   # Wishlist item card used on the dedicated wishlist detail page
│   ├── cart/                   # Cart page, line item, summary
│   ├── checkout/               # Checkout form + order summary
│   ├── about/                  # About Us content
│   ├── contact/                # Contact form
│   └── ui/
│       ├── animated-letters.tsx # Character-by-character stagger animation (Framer Motion variants)
│       ├── form-input.tsx       # Shared FormInput — label, input, error + shake animation
│       ├── toast-container.tsx  # Fixed bottom-right toast portal — slides in from right; shows product thumbnail
│       ├── scroll-progress-bar.tsx
│       ├── smooth-scroll-provider.tsx
│       ├── section-title.tsx
│       └── stars.tsx
├── content/
│   └── branding.json           # Header/footer contact info, socials, copyright year (store name/logo: contracts branding.json)
├── providers/
│   └── query-provider.tsx      # TanStack QueryClientProvider (client component)
├── lib/
│   ├── api/
│   │   ├── axios.ts            # Axios instance — base URL, auth header interceptor, error normaliser
│   │   └── auth.api.ts         # Typed API functions: signupApi, loginApi, refreshApi, logoutApi
│   ├── store/
│   │   ├── auth.store.ts       # Zustand (persist) — persists `user` only (access token stays in memory); cleared on sign-out
│   │   ├── cart.store.ts       # Zustand (persist) — items[], totalItems, addItem, removeItem, updateQuantity
│   │   ├── wishlist.store.ts   # Zustand (persist) — items[], addItem, removeItem, clear
│   │   └── toast.store.ts      # Zustand (no persist) — toast queue; push(variant, message, product?), remove(id)
│   ├── hooks/
│   │   ├── use-signup.ts       # TanStack useMutation → signupApi → setAuth + push toast
│   │   └── use-login.ts        # TanStack useMutation → loginApi → setAuth + push toast
│   ├── schemas/
│   │   └── auth.schema.ts      # Re-exports loginSchema; extends signupSchema with confirm field
│   ├── api/
│   │   └── product.api.ts      # getProductsApi/getProductBySlugApi — fetch from /api/v1/products, fail soft
│   └── data/
│       └── navigation.ts       # navItems, topBarLinks
└── package.json
```

### State management

| Store                | Library                 | Persist                                  | Purpose                                                                                                                          |
| -------------------- | ----------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `useAuthStore`       | Zustand + `persist`     | `localStorage` (key `auth`, `user` only) | `user` (persisted), `accessToken` (memory only); `setAuth`, `setAccessToken`, `clearAuth`                                        |
| `useCartStore`       | Zustand + `persist`     | `localStorage` (key `cart`)              | `items[]`, `totalItems`; `addItem` (increments qty if duplicate), `removeItem`, `updateQuantity`, `clearCart`                    |
| `useWishlistStore`   | Zustand + `persist`     | `localStorage` (key `wishlist`)          | `items[]`; `addItem`, `removeItem`, `clear`; toggle pattern: call `addItem` or `removeItem` based on current state               |
| `useToastStore`      | Zustand                 | none (ephemeral)                         | `toasts[]`; `push(variant, message, product?)` — auto-dismisses after 4 s; optional `product: { img, name }` renders a thumbnail |
| TanStack Query       | `@tanstack/react-query` | none                                     | Server state for API mutations (signup, login)                                                                                   |
| Component `useState` | React                   | none                                     | Local UI state — dropdowns, tabs, pagination, password visibility                                                                |

#### Zustand selector rules

- **Always subscribe to a derived value**, never to the store's function reference.
- For booleans (is-in-cart, is-wishlisted), compute inline:
  ```tsx
  // ✅ re-renders only when the boolean flips
  const isInCart = useCartStore((s) =>
    s.items.some((i) => i.product.id === product.id),
  );

  // ❌ subscribes to a stable function ref — component never re-renders
  const isInCart = useCartStore((s) => s.isInCart);
  ```
- For counts, subscribe to the primitive:
  ```tsx
  const totalItems = useCartStore((s) => s.totalItems);
  const wishlistCount = useWishlistStore((s) => s.items.length);
  ```
- Avoid subscribing to full arrays (`s.items`) in cards — that re-renders every card when any item's quantity changes. Use the boolean form above.

### Auth flow

```
1. User submits LoginForm / SignupForm
2. React Hook Form validates locally (Zod resolver)
3. TanStack useMutation calls loginApi / signupApi via Axios
4. On success:
   - API sets refresh_token in HttpOnly cookie (path-scoped to /api/v1/auth/refresh)
   - JSON body contains { user, accessToken }
   - useAuthStore.setAuth(user, accessToken) stores both (only `user` is persisted to localStorage; the access token stays in memory)
   - Success toast fires; router.push("/account")
5. On API error:
   - Field errors (e.g. { field: "email", message: "..." }) → RHF setError → input shakes
   - Non-field errors → root.server error → banner above the form
6. Access token attached to all subsequent requests via Axios request interceptor
7. Token refresh: POST /api/v1/auth/refresh (cookie sent automatically)
8. On page refresh: Zustand rehydrates `user` from localStorage; the access token is gone, so the first authenticated request gets a 401 and the axios interceptor silently refreshes it via the HttpOnly cookie
```

### API integration

All API calls go through the shared Axios instance in `lib/api/axios.ts`:

- `baseURL` reads from `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000`).
- `withCredentials: true` — sends the HttpOnly refresh cookie on `/refresh` calls.
- Request interceptor attaches `Authorization: Bearer <token>` from `useAuthStore`.
- Response interceptor normalises Axios errors to `ApiErrorBody` shape — consumers get a consistent type.

### Forms — React Hook Form pattern

All forms use the same pattern:

```tsx
const {
  register,
  handleSubmit,
  setError,
  formState: { errors },
} = useForm<FormValues>({
  resolver: zodResolver(schema), // client-side validation via shared Zod schema
});

function onSubmit(values) {
  mutate(values, {
    onError: (err: ApiErrorBody) => {
      err.errors?.forEach(({ field, message }) => {
        if (field)
          setError(field, { message }); // maps server error to field
        else setError("root.server", { message: err.message });
      });
    },
  });
}
```

Field errors render via `<FormInput error={errors.field?.message} />` which shakes the input with Framer Motion `useAnimate`.

### Styling approach

- **Tailwind CSS v4** — `@import "tailwindcss"` in `globals.css`. No `tailwind.config.js`.
- **Design tokens** in `globals.css @theme {}`. Always use tokens — never hardcode hex values.
- **Font**: Open Sans via `next/font/google`, injected as `--font-open-sans` → `--font-sans`.

#### Token reference

```
Accent:    accent (#f25862), accent-dark (#d4404a)
Text:      foreground (#252525), secondary (#6a6a6a), muted (#aaaaaa), subtle (#cccccc)
Surfaces:  wash (#f5f5f5), surface (#f9f9f9)
Borders:   line (#eaeaea), line-light (#f0f0f0)
Specific:  header, overlay, footer, hero
Shadows:   shadow-card, shadow-card-hover, shadow-dropdown, shadow-sticky
```

### Development commands

```bash
pnpm dev          # Next.js dev server on http://localhost:3000
pnpm build        # Production build
pnpm start        # Serve production build
pnpm lint         # ESLint (zero warnings tolerance)
pnpm check-types  # tsc --noEmit
```

## Part 2 — Engineering conventions

Read this before writing any code in this app. These conventions are enforced by type-checking and code review.

### Architecture overview

```
app/ (Server Components)
  └── layout.tsx          → QueryProvider, ToastContainer, font, Lenis
  └── [route]/page.tsx    → thin shell: layout wrapper + feature component
components/
  └── feature/            → all logic lives here (Client Components)
content/
  └── *.json              → editable copy/branding, no code changes needed
lib/
  └── store/              → Zustand stores (global state)
  └── api/                → Axios functions (API calls)
  └── hooks/              → TanStack Query mutations/queries
```

Pages (`app/*/page.tsx`) are Server Components that only render layout shells and feature components. All interactivity, store reads, and API calls happen inside `components/`.

### Content — where copy and branding live

- **Page copy** (home, about, contact, blog, condition guide) lives in the API's `site_content` table. It is seeded from `apps/api/scripts/seed-data/*.json` (`pnpm seed:content`) and edited in the admin panel; the storefront reads it through `lib/api/content.api.ts`.
- **`content/branding.json`** holds header/footer contact info, social text and the copyright year. The store name, display name, description and logo are **not** here: they live in `packages/contracts/src/branding.json` (shared with the admin panel and API emails) and are imported as `branding` from `@ecommerce/contracts`.

**Icons can't be serialized to JSON** — store an icon name as a string (e.g. `"icon": "Phone"`) and map it to the lucide component in the consuming file (see `components/layout/footer.tsx`):

```tsx
import { Phone, type LucideIcon } from "lucide-react";
const ICONS: Record<string, LucideIcon> = { Phone };
```

Product data comes from the API (`lib/api/product.api.ts`) — do not add a static product catalogue.

### Zustand stores — rules

All client state uses **Zustand**. The stores live in `lib/store/`.

#### Available stores

| Store              | File                | Persist key | Purpose                           |
| ------------------ | ------------------- | ----------- | --------------------------------- |
| `useAuthStore`     | `auth.store.ts`     | `auth`      | Authenticated user + access token |
| `useCartStore`     | `cart.store.ts`     | `cart`      | Shopping cart items + totals      |
| `useWishlistStore` | `wishlist.store.ts` | `wishlist`  | Saved/wishlisted products         |
| `useToastStore`    | `toast.store.ts`    | none        | Ephemeral toast notifications     |

#### Selector rules (critical — read before writing any component)

**Always subscribe to a derived value**, never to the store's method or full array when a boolean will do:

```tsx
// ✅ — re-renders only when the boolean flips
const isInCart = useCartStore((s) =>
  s.items.some((i) => i.product.id === product.id),
);
const wishlisted = useWishlistStore((s) =>
  s.items.some((i) => i.product.id === product.id),
);

// ❌ — subscribes to a stable function reference; component never re-renders on state change
const isInCart = useCartStore((s) => s.isInCart);

// ✅ — subscribe to a primitive, not the full array
const totalItems = useCartStore((s) => s.totalItems);
const wishlistCount = useWishlistStore((s) => s.items.length);

// ❌ — subscribes to the full array; re-renders the card every time any item's qty changes
const items = useCartStore((s) => s.items);
```

The stale-selector bug: if you subscribe to `s.methodName` (a function), the selector returns the same function reference every render — Zustand sees no change and never re-renders the component, even though the underlying data has changed. Always subscribe to a value.

#### Adding a new store

1. Create `lib/store/<name>.store.ts`.
2. Use `create<State>()(persist((set, get) => ({ ... }), { name: "<key>" }))` for persistent stores, or plain `create<State>()` for ephemeral.
3. Export only `use<Name>Store` (the hook). Do not export the raw store object.
4. Update the state-management table in this file.
5. Never put API calls inside a store — stores hold state only; mutations go in TanStack Query hooks.

### Cart behaviour

- `addItem({ product, quantity })` — increments `quantity` if the product is already in the cart.
- Button states in `product-card.tsx` and all other cart buttons:

  | State              | Condition                 | Icon + Label       |
  | ------------------ | ------------------------- | ------------------ |
  | Default            | `!isInCart && !justAdded` | 🛒 + "Add to Cart" |
  | Just added (1.2 s) | `justAdded`               | ✓ only (no text)   |
  | Persistent in-cart | `isInCart && !justAdded`  | ✓ + "In Cart"      |

- All three states are encoded as keyed children inside a **single** `AnimatePresence mode="wait"` so only one element is ever visible — no double-tick. Never put the icon outside `AnimatePresence` as a sibling of the text span.

### Wishlist behaviour

- Wishlist is a **toggle**: check `wishlisted` boolean first, then call `addItem` or `removeItem`.
- Always-visible badge: render the accent heart badge in the card image whenever `wishlisted` is true (no hover required).
- Auto-remove from wishlist after cart add: `setTimeout(() => onRemove(product.id), 600)` — allows the ✓ animation to play before the card exits.
- Never reset `cartAdded` state inside the wishlist page — the card auto-removes, so the timer never fires.

### AnimatedLetters — rules

`components/ui/animated-letters.tsx` splits a string into characters and staggers them in with Framer Motion variants.

```tsx
<AnimatedLetters text="Add to Cart" />
```

**Rules:**

- **Never pass a string ending in `!`** — the `!` renders as a tiny `inline-block motion.span` that looks like a second checkmark alongside a `<Check />` icon at small button sizes.
- Always wrap in `AnimatePresence mode="wait"` with a `key` that changes when the text changes.
- Keep text ≤ 10 characters; longer strings clip at small button sizes.
- For buttons that switch between icon-only and icon+text states, put **everything** (icon + text) inside the same `AnimatePresence`, not as siblings. Example from `product-card.tsx`:

  ```tsx
  <AnimatePresence mode="wait">
    {justAdded ? (
      <motion.span key="check-solo" ...><Check size={13} /></motion.span>
    ) : isInCart ? (
      <motion.span key="in-cart" className="flex items-center gap-1.5" ...>
        <Check size={13} /><AnimatedLetters text="In Cart" />
      </motion.span>
    ) : (
      <motion.span key="add-to-cart" className="flex items-center gap-1.5" ...>
        <ShoppingCart size={13} /><AnimatedLetters text="Add to Cart" />
      </motion.span>
    )}
  </AnimatePresence>
  ```

### Toast system

Toasts slide in from the right and auto-dismiss after 4 s.

```ts
const push = useToastStore((s) => s.push);

push("success", "Added to Cart", { img: product.img, name: product.name });
push("error", "Something went wrong"); // no product thumbnail
```

- The third argument `product?: { img: string; name: string }` is optional. Always pass it for cart/wishlist actions.
- Never call `push` with `"Added!"` as the message — the `!` confuses label detection in `toast-container.tsx`.
- The context label ("Cart" vs "Wishlist") is auto-detected from the message string in `toast-container.tsx`. Keep messages as-is: `"Added to Cart"`, `"Added to Wishlist"`, `"Removed from Wishlist"`.

### Component patterns

#### Page shell (Server Component)

```tsx
// app/wishlist/page.tsx
import type { Metadata } from "next";
import { TopBar } from "@/components/layout/top-bar";
import { Header } from "@/components/layout/header";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Footer } from "@/components/layout/footer";
import { WishlistPage } from "@/components/wishlist/wishlist-page";

export const metadata: Metadata = { title: `Wishlist — ${branding.storeName}` };

export default function WishlistRoute() {
  return (
    <div className="font-sans bg-white text-secondary">
      <TopBar />
      <Header />
      <Breadcrumb
        crumbs={[{ label: "Home", href: "/" }, { label: "Wishlist" }]}
      />
      <WishlistPage />
      <Footer />
    </div>
  );
}
```

#### Feature component (Client Component)

All feature components are `"use client"` and import from `lib/store/` directly. Never pass store state down as props to avoid prop-drilling.

#### Page title style

Match the established heading style used on Cart and Wishlist pages:

```tsx
<h1 className="text-xl font-bold text-foreground uppercase tracking-widest">
  <span className="text-secondary mr-1.5">/</span>
  Page Title
  <span className="text-accent">.</span>
</h1>
```

### Routing

- All routes live in `app/` using Next.js App Router file conventions.
- Dynamic routes: `app/products/[slug]/page.tsx` — products are DB-driven via the API, so this route is `export const dynamic = "force-dynamic"`, not `generateStaticParams`.
- `getProductBySlugApi`/`getProductsApi` (`lib/api/product.api.ts`) fetch from `/api/v1/products`; they fail soft (`null`/`[]`) on error rather than throwing, so pages degrade instead of 500ing.
- Auth-required pages (`/account`) show a redirect-to-login dialog via `useAuthStore` — never rely on middleware alone for UX gating.
- `app/robots.ts` and `app/sitemap.ts` are metadata routes: `sitemap.ts` pulls live product slugs (`getProductsApi`) and blog post slugs (`getBlogContent`) — new dynamic content types that should be crawlable need an entry added there too.
- Private/transactional pages (`/cart`, `/checkout`, `/account`, `/login`, `/signup`, `/wishlist`, `/forgot-password`, `/reset-password`) set `robots: { index: false, follow: true }` in their `metadata` and are listed in `app/robots.ts`'s `disallow`. Add both when creating a new account-gated or transactional route.
- Root `layout.tsx` sets default `openGraph`/`twitter` metadata and renders `Organization` JSON-LD — pages only need to override `openGraph`/`twitter` when they have a more specific image (see product page). `components/layout/breadcrumb.tsx` emits `BreadcrumbList` JSON-LD from the same `crumbs` prop passed for the visual breadcrumb, so no extra wiring is needed per page.
- `app/llms.txt/route.ts` is a plain Route Handler (llms.txt has no Next.js-native metadata route, unlike robots.ts/sitemap.ts) listing live products and blog posts for AI crawlers — update it alongside `sitemap.ts` if a new content type needs to be discoverable.

### Shop filters (`/shop`)

- **URL is the source of truth.** `lib/shop/params.ts` parses search params and builds hrefs (`shopHref`) with a fixed key order and sorted values.
- First load is server-rendered (SEO): `app/shop/page.tsx` awaits `searchParams` and hands the catalogue + parsed filters to `<ShopView>` (`components/shop/shop-view.tsx`).
- After hydration, filtering is client-side: `ShopView` re-runs the pure `queryShop()` (`lib/shop/query.ts`) and rewrites the URL with `history.replaceState` (pagination uses `pushState`; `popstate` resyncs). No server round trip per click.
- Every filter control is a `<ShopLink>` — a real `<a href>` (crawlable, works without JS) that `ShopView` intercepts. Don't replace them with buttons or `router.push`.
- Add a sidebar filter by adding one entry to `FACET_CONFIG` in `lib/shop/query.ts` (plus its key in `FACET_KEYS` and the `Product` type). Current groups: Categories (surfaces nest under each category as a hover dropdown — `children` in `queryShop`), Shop For, Size, Brands, Colour, Price — don't add more without removing one.
- Don't use `useSearchParams` here (forces a Suspense boundary / CSR bailout); state flows from `ShopView`.
- `lib/shop/*` must stay free of data, server- or browser-only imports — both sides run it.
- `app/shop/loading.tsx` makes the dynamic route partially prefetchable, so navigating to /shop paints instantly.
- Filtered URLs canonicalise to `/shop`; more than one active filter adds `noindex`.
- When the catalogue outgrows a few hundred items, move paging/filtering to the API (the page then fetches per request).

### Styling rules

- Always use design tokens. Never hardcode hex values (`#252525`, `#f25862`, etc.).
- Use `accent` for active/selected states, `foreground` for default dark buttons.
- Button hover: `hover:bg-accent` on dark buttons; `hover:bg-foreground` on accent buttons.
- Cards use `bg-wash` for image backgrounds; `shadow-card` at rest, `shadow-card-hover` on hover.
- Lenis runs with `allowNestedScroll`: inner `overflow-y-auto` containers scroll natively and hand off to the page at their edges. Don't add `data-lenis-prevent` (it blocks that hand-off).
- Full-screen overlays (`detail/lightbox.tsx`) must be portalled to `document.body` at `z-[9998]` — the sticky header sits at `z-500` and would otherwise cover them.
- `overflow-hidden` on buttons clips `AnimatedLetters` characters that start at `y: 10` — this is intentional (characters animate up into view from below).

### Store reviews (product page)

- Reviews are store-wide, not per-product (see `apps/api/CONTEXT.md`) — `components/product/detail/store-reviews.tsx` (rendered from the "Store Reviews" tab in `product-tabs.tsx`) lists every review and, for signed-in users, a form to add one.
- One review per order (`orderId` in the payload), not per product — the form asks for the order reference directly since there's no "my orders" listing yet.
- Media attachments upload immediately on file-select via `lib/api/review-media.api.ts` → `/api/v1/media/review-upload(-video)`, and the returned URL is held in local state until submit. Removing an attachment calls the delete endpoint immediately, not just locally.
- `lib/hooks/use-reviews.ts` holds the TanStack Query hooks (`useStoreReviews`, `useCreateReview`, `useUploadReviewMedia`, `useDeleteReviewMedia`) — follow this pattern (not raw `fetch`) when adding more review UI.

### What not to do

- Do not subscribe to a store method as a selector — subscribe to a derived value.
- Do not subscribe to `s.items` in a card component — use `s.items.some(...)` for a boolean.
- Do not pass `"Added!"` or any text ending in `!` to `<AnimatedLetters>` — the `!` looks like a second tick.
- Do not place the `<Check />` or `<ShoppingCart />` icon outside `AnimatePresence` as a sibling of the text span — it causes both icon and text to animate simultaneously (double-tick bug).
- Do not read `process.env` directly in components — use `NEXT_PUBLIC_*` env vars through `next.config` or inline.
- Do not call `res.json()` or import Express types in this package.
- Do not hardcode product data in components — fetch it via `lib/api/product.api.ts`.
- Do not hardcode page copy or branding (store name, contact info, headings, body text) in components — put it in the page-content seed data (or `branding.json` for the store name and contact details). Never write a store name as a literal.
- Do not use `interface` — use `type`.
- Do not add comments explaining what code does — only add comments for non-obvious constraints or workarounds.
- **Do not finish a task without updating this file.**

### Checkout & JazzCash payment

`components/checkout/checkout-form.tsx` requires a signed-in user (the order is built from the **server** cart; guests are shown sign-in/sign-up links and their local cart merges at login). Payment is manual JazzCash: `jazzcash-payment.tsx` shows the QR, account name/number (with a Copy button) and support phone fetched from `GET /content/payment` via `usePaymentContent()` (admin-editable — never hardcode them), and collects a screenshot. Submit = upload via `uploadPaymentProofApi` → `placeOrderApi` (one `idempotencyKey` per checkout attempt; the upload is reused on retry). A 409 means an item sold out → `fetchAndHydrate()` refreshes the cart so it shows "Sold out". Shipping totals come from `shippingCostMinor()` in `@ecommerce/contracts` (same rule the API uses) — never re-implement it locally. Sign-in/sign-up links from checkout carry `?next=/checkout`; the login/signup server pages read `searchParams`, sanitise it with `safeNext()` (same-site paths only) and pass `redirectTo` to the forms. **Before launch:** fill in the real account details and QR in the admin "Payment Details" page — until then checkout shows "Online payment isn't available" and disables Place Order (the API also refuses with 503).

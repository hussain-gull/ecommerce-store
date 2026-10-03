import { createHash } from "node:crypto";
import {
  SHOP_FACET_KEYS,
  SHOP_PAGE_SIZE,
  type ShopFacetKey,
  type ShopFacetOption,
  type ShopQuery,
  type ShopQueryResult,
} from "@ecommerce/contracts";
import { db } from "../prisma/db.js";
import { config } from "../config.js";
import { cacheCounter, cacheGet, cacheSet } from "../utils/redis.util.js";
import {
  PRODUCTS_VERSION_KEY,
  conditionNamesFor,
  rowToProduct,
  variantsAndMediaFor,
} from "./product.service.js";

// Storefront filtering runs in Postgres: SQL WHERE + ORDER BY + LIMIT/OFFSET for
// the page, aggregate queries for the sidebar counts. Facet counts follow the
// "skip self" rule — a facet's own selection never narrows its own list — so
// picking "Nike" doesn't zero out "Adidas".

const P = () =>
  db.orm.public.products.where({ is_published: true, deleted_at: null });

const NO_MATCH = "00000000-0000-0000-0000-000000000000";
const likeEscape = (s: string) => s.replace(/[\\%_]/g, "\\$&");

type Facets = Record<ShopFacetKey, string[]>;
const SCALAR_FACETS = ["category", "surface", "brand", "gender"] as const;

// Normalised so equivalent filters share one cache entry.
function normalise(q: ShopQuery): ShopQuery {
  const sorted = (v: string[]) => [...new Set(v)].sort();
  return {
    ...(Object.fromEntries(
      SHOP_FACET_KEYS.map((k) => [k, sorted(q[k])]),
    ) as Facets),
    q: q.q,
    minPrice: q.minPrice,
    maxPrice: q.maxPrice,
    sort: q.sort,
    page: q.page,
  };
}

// Products matching every filter except the (optional) skipped facet.
async function matching(
  q: ShopQuery,
  conditionIds: string[],
  skip?: ShopFacetKey,
) {
  let c = P();
  const on = (k: ShopFacetKey) => k !== skip && q[k].length > 0;
  for (const k of SCALAR_FACETS) {
    if (on(k)) c = c.where((p) => p[k].in(q[k]));
  }
  if (on("condition")) c = c.where((p) => p.condition_id.in(conditionIds));
  if (on("size")) c = c.where((p) => p.variants.some((v) => v.size.in(q.size)));
  if (on("colour")) {
    c = c.where((p) => p.variants.some((v) => v.color_name.in(q.colour)));
  }
  if (q.minPrice !== undefined)
    c = c.where((p) => p.price.gte(String(q.minPrice)));
  if (q.maxPrice !== undefined)
    c = c.where((p) => p.price.lte(String(q.maxPrice)));
  if (q.q) c = c.where((p) => p.name.ilike(`%${likeEscape(q.q)}%`));
  return c;
}

const withSelected = (counts: Map<string, number>, selected: string[]) => {
  for (const v of selected) if (!counts.has(v)) counts.set(v, 0);
  return [...counts].map(([value, count]) => ({ value, count }));
};

async function facetsFor(q: ShopQuery, conditionIds: string[]) {
  const conditionNames = new Map(
    (await db.orm.public.filter_options.where({ kind: "condition" }).all()).map(
      (o) => [o.id, o.name],
    ),
  );

  const scalar = (k: (typeof SCALAR_FACETS)[number]) =>
    matching(q, conditionIds, k).then(async (c) => {
      const rows = await c.groupBy(k).aggregate((a) => ({ n: a.count() }));
      const counts = new Map<string, number>();
      for (const r of rows) if (r[k]) counts.set(r[k] as string, r.n);
      return withSelected(counts, q[k]);
    });

  const condition = matching(q, conditionIds, "condition").then(async (c) => {
    const rows = await c
      .groupBy("condition_id")
      .aggregate((a) => ({ n: a.count() }));
    const counts = new Map<string, number>();
    for (const r of rows) {
      const name = r.condition_id && conditionNames.get(r.condition_id);
      if (name) counts.set(name, (counts.get(name) ?? 0) + r.n);
    }
    return withSelected(counts, q.condition);
  });

  // Variant facets: count distinct PRODUCTS (a product with two colours of one
  // size counts once). Sizes keep every catalogue value so the grid never reflows.
  const variantFacet = (k: "size" | "colour", col: "size" | "color_name") =>
    Promise.all([
      matching(q, conditionIds, k).then((c) => c.select("id").all()),
      db.orm.public.product_variants.select(col).all(),
    ]).then(async ([ids, all]) => {
      const rows = ids.length
        ? await db.orm.public.product_variants
            .where((v) => v.product_id.in(ids.map((i) => i.id)))
            .select("product_id", col)
            .all()
        : [];
      const perValue = new Map<string, Set<string>>();
      for (const r of rows) {
        const v = r[col];
        (perValue.get(v) ?? perValue.set(v, new Set()).get(v)!).add(
          r.product_id,
        );
      }
      const counts = new Map<string, number>();
      if (k === "size") for (const r of all) counts.set(r.size, 0);
      for (const [v, set] of perValue) counts.set(v, set.size);
      return withSelected(counts, q[k]);
    });

  // Surfaces per category, counted ignoring the category/surface picks themselves.
  const surfaces = matching(
    { ...q, category: [], surface: [] },
    conditionIds,
  ).then(async (c) => {
    const rows = await c
      .groupBy("category", "surface")
      .aggregate((a) => ({ n: a.count() }));
    const byCat = new Map<string, { value: string; count: number }[]>();
    for (const r of rows) {
      if (!r.surface) continue;
      (
        byCat.get(r.category) ?? byCat.set(r.category, []).get(r.category)!
      ).push({
        value: r.surface,
        count: r.n,
      });
    }
    return byCat;
  });

  const [category, surface, brand, gender, cond, size, colour, byCat] =
    await Promise.all([
      scalar("category"),
      scalar("surface"),
      scalar("brand"),
      scalar("gender"),
      condition,
      variantFacet("size", "size"),
      variantFacet("colour", "color_name"),
      surfaces,
    ]);

  const sortOpts = (o: { value: string; count: number }[], numeric = false) =>
    o.sort((a, b) =>
      numeric
        ? Number(a.value) - Number(b.value)
        : a.value.localeCompare(b.value),
    );
  const categoryOpts: ShopFacetOption[] = sortOpts(category).map((o) => ({
    ...o,
    children: sortOpts(byCat.get(o.value) ?? []),
  }));

  return {
    category: categoryOpts,
    surface: sortOpts(surface),
    size: sortOpts(size, true),
    brand: sortOpts(brand),
    colour: sortOpts(colour),
    condition: sortOpts(cond),
    gender: sortOpts(gender),
  } satisfies Record<ShopFacetKey, ShopFacetOption[]>;
}

async function priceBounds() {
  const r = await P().aggregate((a) => ({
    lo: a.min("price"),
    hi: a.max("price"),
  }));
  return {
    min: Math.floor(Number(r.lo ?? 0)),
    max: Math.ceil(Number(r.hi ?? 0)),
  };
}

async function run(q: ShopQuery): Promise<ShopQueryResult> {
  // Condition filters arrive as names (what cards display); the column holds ids.
  const conditionIds = q.condition.length
    ? (
        await db.orm.public.filter_options
          .where({ kind: "condition" })
          .where((o) => o.name.in(q.condition))
          .all()
      ).map((o) => o.id)
    : [];
  if (q.condition.length && conditionIds.length === 0)
    conditionIds.push(NO_MATCH);

  const filtered = await matching(q, conditionIds);
  const { n: total } = await filtered.aggregate((a) => ({ n: a.count() }));
  const pageCount = Math.max(1, Math.ceil(total / SHOP_PAGE_SIZE));
  const page = Math.min(q.page, pageCount);

  const ordered =
    q.sort === "price-asc"
      ? filtered.orderBy([(p) => p.price.asc(), (p) => p.id.desc()])
      : q.sort === "price-desc"
        ? filtered.orderBy([(p) => p.price.desc(), (p) => p.id.desc()])
        : // UUIDv7 ids are time-ordered, so id desc = newest first (also the default order).
          filtered.orderBy((p) => p.id.desc());
  const rows = await ordered
    .limit(SHOP_PAGE_SIZE)
    .offset((page - 1) * SHOP_PAGE_SIZE)
    .all();

  const [{ variants, media }, conditions, facets, bounds] = await Promise.all([
    variantsAndMediaFor(rows.map((r) => r.id)),
    conditionNamesFor(rows),
    facetsFor(q, conditionIds),
    priceBounds(),
  ]);

  return {
    items: rows.map((row) =>
      rowToProduct(
        row,
        media.filter((m) => m.product_id === row.id),
        variants.filter((v) => v.product_id === row.id),
        conditions,
      ),
    ),
    total,
    page,
    pageCount,
    facets,
    priceBounds: bounds,
  };
}

// Same-key requests already running on this instance share one DB run (stampede guard).
const inflight = new Map<string, Promise<ShopQueryResult>>();

export async function queryProductsService(
  input: ShopQuery,
): Promise<ShopQueryResult> {
  const q = normalise(input);
  // Version-namespaced key: bumping products:ver (every product/stock/condition
  // write) orphans all cached queries at once; the TTL only reaps the orphans.
  const ver = await cacheCounter(PRODUCTS_VERSION_KEY);
  const key =
    ver === null
      ? null
      : `products:q:v${ver}:${createHash("sha1").update(JSON.stringify(q)).digest("hex")}`;

  if (key) {
    const hit = await cacheGet<ShopQueryResult>(key);
    if (hit) return hit;
  }
  const flight = key ?? JSON.stringify(q);
  const running = inflight.get(flight);
  if (running) return running;

  const p = run(q)
    .then(async (result) => {
      // Re-read the version: a write that landed mid-query must not be cached as fresh.
      if (key && (await cacheCounter(PRODUCTS_VERSION_KEY)) === ver) {
        await cacheSet(key, result, config.cacheTtlSeconds);
      }
      return result;
    })
    .finally(() => inflight.delete(flight));
  inflight.set(flight, p);
  return p;
}

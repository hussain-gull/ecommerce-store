import type {
  AdminProduct,
  AdminProductCounts,
  AdminProductsQuery,
  PaginationMeta,
  CreateProductPayload,
  Product,
  ProductDetail,
  UpdateProductPayload,
} from "@ecommerce/contracts";
import { LOW_STOCK_THRESHOLD, formatMoney } from "@ecommerce/contracts";
import { and, or } from "@prisma/orm-postgres/orm-client";
import { db } from "../prisma/db.js";
import { nowUtc } from "../utils/datetime.util.js";
import { uuidv7 } from "../utils/uuid.util.js";
import { createHttpError } from "../utils/response.util.js";
import {
  cacheDel,
  cacheGet,
  cacheIncr,
  cacheSet,
} from "../utils/redis.util.js";
import { adjustStock } from "./stock.service.js";
import { moveToRecycleBinByUrl } from "../utils/cloudinary.util.js";

const PUBLISHED_PRODUCTS_CACHE_KEY = "products:published";

/** Stock is part of the public list (SOLD OUT badge), so orders must drop the cached list too. */
/** Redis counter that namespaces every cached shop query — bumping it orphans them all at once. */
export const PRODUCTS_VERSION_KEY = "products:ver";

export const invalidatePublishedProductsCache = () =>
  Promise.all([
    cacheDel(PUBLISHED_PRODUCTS_CACHE_KEY),
    cacheIncr(PRODUCTS_VERSION_KEY),
  ]);

// ── rows ─────────────────────────────────────────────────────────────────────

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: string;
  sale_price: string | null;
  sku: string;
  category: string;
  brand: string | null;
  gender: string | null;
  surface: string | null;
  condition_id: string | null;
  tags: readonly string[];
  is_published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
};

type VariantRow = {
  id: string;
  product_id: string;
  size: string;
  color_name: string;
  color_hex: string;
  stock: number;
};

type MediaRow = {
  id: string;
  product_id: string;
  type: string;
  url: string;
  poster_url: string | null;
  position: number;
};

// ── mappers ──────────────────────────────────────────────────────────────────

function isGender(v: string): v is "Men" | "Women" | "Kids" {
  return v === "Men" || v === "Women" || v === "Kids";
}

// Maps a DB row + its variants/media to the public storefront shape consumed
// by the existing web catalogue components (Product/ProductDetail) — the web
// app never has to know the data now comes from Postgres instead of a static file.
export function rowToProduct(
  row: ProductRow,
  media: MediaRow[],
  variants: VariantRow[] = [],
  conditions: Map<string, string> = new Map(),
): Product {
  const sizes = [
    ...new Set(variants.map((v) => v.size).filter(Boolean)),
  ] as string[];
  const condition = row.condition_id
    ? conditions.get(row.condition_id)
    : undefined;
  const cover = media.find((m) => m.type === "image") ?? media[0];
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: formatMoney(row.price),
    ...(row.sale_price
      ? { salePrice: formatMoney(row.sale_price), sale: true }
      : {}),
    // No per-product rating source — reviews are store-wide (see store_reviews).
    rating: 0,
    img: cover?.url ?? "",
    category: row.category,
    ...(row.brand ? { brand: row.brand } : {}),
    ...(row.gender && isGender(row.gender) ? { gender: row.gender } : {}),
    ...(row.surface ? { surface: row.surface } : {}),
    ...(sizes.length ? { sizes } : {}),
    variants: variants.map((v) => ({
      size: v.size,
      colorName: v.color_name,
      colorHex: v.color_hex,
      stock: v.stock,
    })),
    ...(condition ? { condition } : {}),
  };
}

function rowToProductDetail(
  row: ProductRow,
  variants: VariantRow[],
  media: MediaRow[],
  relatedProducts: Product[],
  conditions: Map<string, string>,
): ProductDetail {
  const sizes = [...new Set(variants.map((v) => v.size))];
  const colors = [
    ...new Map(
      variants.map((v) => [
        v.color_name,
        { name: v.color_name, hex: v.color_hex },
      ]),
    ).values(),
  ];

  return {
    ...rowToProduct(row, media, variants, conditions),
    sku: row.sku,
    description: row.description,
    media: media
      .sort((a, b) => a.position - b.position)
      .map((m) =>
        m.type === "video"
          ? { type: "video", src: m.url, poster: m.poster_url ?? "" }
          : { type: "image", src: m.url },
      ),
    ...(sizes.length ? { sizes } : {}),
    ...(colors.length ? { colors } : {}),
    ...(row.tags.length ? { tags: [...row.tags] } : {}),
    reviewCount: 0,
    relatedProducts,
  };
}

function rowToAdminProduct(
  row: ProductRow,
  variants: VariantRow[],
  media: MediaRow[],
): AdminProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price: row.price,
    ...(row.sale_price ? { salePrice: row.sale_price } : {}),
    sku: row.sku,
    category: row.category,
    ...(row.brand ? { brand: row.brand } : {}),
    ...(row.gender && isGender(row.gender) ? { gender: row.gender } : {}),
    ...(row.surface ? { surface: row.surface } : {}),
    ...(row.condition_id ? { conditionId: row.condition_id } : {}),
    tags: [...row.tags],
    isPublished: row.is_published,
    ...(row.meta_title ? { metaTitle: row.meta_title } : {}),
    ...(row.meta_description ? { metaDescription: row.meta_description } : {}),
    variants: variants.map((v) => ({
      id: v.id,
      stock: v.stock,
      size: v.size,
      colorName: v.color_name,
      colorHex: v.color_hex,
    })),
    media: media
      .sort((a, b) => a.position - b.position)
      .map((m) => ({
        id: m.id,
        type: m.type === "video" ? "video" : "image",
        url: m.url,
        ...(m.poster_url ? { posterUrl: m.poster_url } : {}),
      })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── helpers ──────────────────────────────────────────────────────────────────

export async function variantsAndMediaFor(
  productIds: string[],
): Promise<{ variants: VariantRow[]; media: MediaRow[] }> {
  if (productIds.length === 0) return { variants: [], media: [] };
  const [variants, media] = await Promise.all([
    db.orm.public.product_variants
      .where((v) => v.product_id.in(productIds))
      .all(),
    db.orm.public.product_media.where((m) => m.product_id.in(productIds)).all(),
  ]);
  return { variants, media };
}

/** id → name for the conditions referenced by `rows` (one query, none if unused). */
export async function conditionNamesFor(
  rows: { condition_id: string | null }[],
): Promise<Map<string, string>> {
  const ids = [
    ...new Set(rows.map((r) => r.condition_id).filter(Boolean)),
  ] as string[];
  if (ids.length === 0) return new Map();
  const found = await db.orm.public.filter_options
    .where((f) => f.id.in(ids))
    .all();
  return new Map(found.map((f) => [f.id, f.name]));
}

async function assertConditionExists(id: string): Promise<void> {
  const row = await db.orm.public.filter_options
    .select("id")
    .where({ id, kind: "condition" })
    .first();
  if (!row) throw createHttpError(422, "Condition not found.");
}

// ── public storefront reads ─────────────────────────────────────────────────

export async function listPublishedProductsService(filters?: {
  category?: string;
}): Promise<Product[]> {
  // Only the unfiltered list is cached — it's the one hit on every /shop load
  // (the storefront filters client-side, see apps/web/lib/shop/query.ts).
  const cacheable = !filters?.category;
  if (cacheable) {
    const cached = await cacheGet<Product[]>(PUBLISHED_PRODUCTS_CACHE_KEY);
    if (cached) return cached;
  }

  const rows = await db.orm.public.products
    .where({
      is_published: true,
      deleted_at: null,
      ...(filters?.category ? { category: filters.category } : {}),
    })
    .orderBy((p) => p.created_at.desc())
    .all();

  const [{ variants, media }, conditions] = await Promise.all([
    variantsAndMediaFor(rows.map((r) => r.id)),
    conditionNamesFor(rows),
  ]);
  const products = rows.map((row) =>
    rowToProduct(
      row,
      media.filter((m) => m.product_id === row.id),
      variants.filter((v) => v.product_id === row.id),
      conditions,
    ),
  );

  if (cacheable) await cacheSet(PUBLISHED_PRODUCTS_CACHE_KEY, products);
  return products;
}

export async function getPublishedProductBySlugService(
  slug: string,
): Promise<ProductDetail> {
  const row = await db.orm.public.products
    .where({ slug, is_published: true, deleted_at: null })
    .first();
  if (!row) throw createHttpError(404, "Product not found.");

  const [{ variants, media }, relatedRows] = await Promise.all([
    variantsAndMediaFor([row.id]),
    db.orm.public.products
      .where({ category: row.category, is_published: true, deleted_at: null })
      .orderBy((p) => p.created_at.desc())
      .all(),
  ]);

  const related = relatedRows.filter((r) => r.id !== row.id).slice(0, 4);
  const [{ variants: relatedVariants, media: relatedMedia }, conditions] =
    await Promise.all([
      variantsAndMediaFor(related.map((r) => r.id)),
      conditionNamesFor([row, ...related]),
    ]);
  const relatedProducts = related.map((r) =>
    rowToProduct(
      r,
      relatedMedia.filter((m) => m.product_id === r.id),
      relatedVariants.filter((v) => v.product_id === r.id),
      conditions,
    ),
  );

  return rowToProductDetail(row, variants, media, relatedProducts, conditions);
}

// ── admin reads/writes ───────────────────────────────────────────────────────

const likeEscape = (v: string) => v.replace(/[\\%_]/g, "\\$&");

export async function listAdminProductsService(
  query: AdminProductsQuery,
): Promise<{ products: AdminProduct[]; meta: PaginationMeta }> {
  let c = db.orm.public.products.where({ deleted_at: null });
  if (query.status) c = c.where({ is_published: query.status === "published" });
  if (query.category) c = c.where({ category: query.category });
  if (query.brand) c = c.where({ brand: query.brand });
  if (query.conditionId) c = c.where({ condition_id: query.conditionId });
  if (query.onSale) c = c.where((p) => p.sale_price.isNotNull());
  if (query.stock === "in") {
    c = c.where((p) => p.variants.some((v) => v.stock.gt(0)));
  } else if (query.stock === "out") {
    c = c.where((p) => p.variants.none((v) => v.stock.gt(0)));
  } else if (query.stock === "low") {
    c = c.where((p) =>
      p.variants.some((v) =>
        and(v.stock.gt(0), v.stock.lte(LOW_STOCK_THRESHOLD)),
      ),
    );
  }
  if (query.q) {
    const like = `%${likeEscape(query.q)}%`;
    c = c.where((p) =>
      or(p.name.ilike(like), p.sku.ilike(like), p.slug.ilike(like)),
    );
  }

  const { n: total } = await c.aggregate((a) => ({ n: a.count() }));
  const ordered =
    query.sort === "oldest"
      ? c.orderBy((p) => p.id.asc())
      : query.sort === "name"
        ? c.orderBy([(p) => p.name.asc(), (p) => p.id.desc()])
        : query.sort === "price-asc"
          ? c.orderBy([(p) => p.price.asc(), (p) => p.id.desc()])
          : query.sort === "price-desc"
            ? c.orderBy([(p) => p.price.desc(), (p) => p.id.desc()])
            : // UUIDv7 ids are time-ordered, so id desc = newest first.
              c.orderBy((p) => p.id.desc());
  const rows = await ordered
    .limit(query.limit)
    .offset((query.page - 1) * query.limit)
    .all();

  const { variants, media } = await variantsAndMediaFor(rows.map((r) => r.id));
  return {
    products: rows.map((row) =>
      rowToAdminProduct(
        row,
        variants.filter((v) => v.product_id === row.id),
        media.filter((m) => m.product_id === row.id),
      ),
    ),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function adminProductCountsService(): Promise<AdminProductCounts> {
  const rows = await db.orm.public.products
    .where({ deleted_at: null })
    .groupBy("is_published")
    .aggregate((a) => ({ n: a.count() }));
  const published = rows.find((r) => r.is_published)?.n ?? 0;
  const draft = rows.find((r) => !r.is_published)?.n ?? 0;
  return { all: published + draft, published, draft };
}

export async function getAdminProductService(
  id: string,
): Promise<AdminProduct> {
  const row = await db.orm.public.products
    .where({ id, deleted_at: null })
    .first();
  if (!row) throw createHttpError(404, "Product not found.");
  const { variants, media } = await variantsAndMediaFor([id]);
  return rowToAdminProduct(row, variants, media);
}

export async function createProductService(
  payload: CreateProductPayload,
): Promise<AdminProduct> {
  const existingSlug = await db.orm.public.products
    .select("id")
    .where({ slug: payload.slug, deleted_at: null })
    .first();
  if (existingSlug) throw createHttpError(409, "Slug is already in use.");

  const existingSku = await db.orm.public.products
    .select("id")
    .where({ sku: payload.sku, deleted_at: null })
    .first();
  if (existingSku) throw createHttpError(409, "SKU is already in use.");

  if (payload.conditionId) await assertConditionExists(payload.conditionId);

  const id = uuidv7();
  const now = nowUtc();
  const row = await db.orm.public.products.create({
    id,
    slug: payload.slug,
    name: payload.name,
    description: payload.description,
    price: payload.price,
    sale_price: payload.salePrice ?? null,
    sku: payload.sku,
    category: payload.category,
    brand: payload.brand ?? null,
    gender: payload.gender ?? null,
    surface: payload.surface ?? null,
    condition_id: payload.conditionId ?? null,
    tags: payload.tags ?? [],
    is_published: payload.isPublished ?? false,
    meta_title: payload.metaTitle ?? null,
    meta_description: payload.metaDescription ?? null,
    created_at: now as any,
    updated_at: now as any,
  });

  await writeVariantsAndMedia(id, payload.variants, payload.media);
  await invalidatePublishedProductsCache();
  const { variants, media } = await variantsAndMediaFor([id]);
  return rowToAdminProduct(row, variants, media);
}

export async function updateProductService(
  id: string,
  payload: UpdateProductPayload,
): Promise<AdminProduct> {
  const existing = await db.orm.public.products
    .where({ id, deleted_at: null })
    .first();
  if (!existing) throw createHttpError(404, "Product not found.");

  if (payload.slug && payload.slug !== existing.slug) {
    const clash = await db.orm.public.products
      .select("id")
      .where({ slug: payload.slug, deleted_at: null })
      .first();
    if (clash) throw createHttpError(409, "Slug is already in use.");
  }
  if (payload.sku && payload.sku !== existing.sku) {
    const clash = await db.orm.public.products
      .select("id")
      .where({ sku: payload.sku, deleted_at: null })
      .first();
    if (clash) throw createHttpError(409, "SKU is already in use.");
  }

  if (payload.conditionId) await assertConditionExists(payload.conditionId);

  await db.orm.public.products.where({ id }).update({
    ...(payload.slug !== undefined ? { slug: payload.slug } : {}),
    ...(payload.name !== undefined ? { name: payload.name } : {}),
    ...(payload.description !== undefined
      ? { description: payload.description }
      : {}),
    ...(payload.price !== undefined ? { price: payload.price } : {}),
    ...(payload.salePrice !== undefined
      ? { sale_price: payload.salePrice ?? null }
      : {}),
    ...(payload.sku !== undefined ? { sku: payload.sku } : {}),
    ...(payload.category !== undefined ? { category: payload.category } : {}),
    ...(payload.brand !== undefined ? { brand: payload.brand ?? null } : {}),
    ...(payload.gender !== undefined ? { gender: payload.gender ?? null } : {}),
    ...(payload.surface !== undefined
      ? { surface: payload.surface ?? null }
      : {}),
    ...(payload.conditionId !== undefined
      ? { condition_id: payload.conditionId ?? null }
      : {}),
    ...(payload.tags !== undefined ? { tags: payload.tags } : {}),
    ...(payload.isPublished !== undefined
      ? { is_published: payload.isPublished }
      : {}),
    ...(payload.metaTitle !== undefined
      ? { meta_title: payload.metaTitle ?? null }
      : {}),
    ...(payload.metaDescription !== undefined
      ? { meta_description: payload.metaDescription ?? null }
      : {}),
    updated_at: nowUtc() as any,
  });

  if (payload.variants !== undefined || payload.media !== undefined) {
    await writeVariantsAndMedia(id, payload.variants, payload.media);
  }

  const row = await db.orm.public.products.where({ id }).first();
  if (!row) throw createHttpError(404, "Product not found.");
  await invalidatePublishedProductsCache();
  const { variants, media } = await variantsAndMediaFor([id]);
  return rowToAdminProduct(row, variants, media);
}

// Soft-delete: the row stays (deleted_at stamped, is_published cleared) so
// order history / audit trail survive, but its Cloudinary assets are moved to the recycle bin
// immediately — a deleted product's images are never shown again.
export async function deleteProductService(id: string): Promise<void> {
  const existing = await db.orm.public.products
    .select("id")
    .where({ id, deleted_at: null })
    .first();
  if (!existing) throw createHttpError(404, "Product not found.");

  const media = await db.orm.public.product_media
    .where({ product_id: id })
    .all();
  await Promise.all(
    media.map((m) =>
      moveToRecycleBinByUrl(m.url, m.type === "video" ? "video" : "image"),
    ),
  );

  // FKs don't cascade-delete — a deleted product must disappear from active
  // carts/wishlists even though its row survives (soft-delete).
  await db.orm.public.cart_items.where({ product_id: id }).deleteAndCount();
  await db.orm.public.wishlist_items.where({ product_id: id }).deleteAndCount();

  await db.orm.public.products.where({ id }).update({
    deleted_at: nowUtc() as any,
    is_published: false,
    updated_at: nowUtc() as any,
  });
  await invalidatePublishedProductsCache();
}

// Variants are reconciled in place — matched by id, else by size+color — so
// their ids and, above all, their live stock survive an edit. The admin form
// submits `stock` plus the `baseStock` it loaded; the difference is applied to
// the *current* stock (compare-and-swap), so orders placed while the form was
// open are never overwritten. Without `baseStock` (create / API clients)
// `stock` is absolute. Rows missing from the payload are deleted; media is
// still replaced wholesale.
async function writeVariantsAndMedia(
  productId: string,
  variants: UpdateProductPayload["variants"],
  media: UpdateProductPayload["media"],
): Promise<void> {
  if (variants !== undefined) {
    await db.transaction(async (tx) => {
      const existing = await tx.orm.public.product_variants
        .where({ product_id: productId })
        .all();
      const key = (size: string, color: string) => `${size}\u0000${color}`;
      const byId = new Map(existing.map((r) => [r.id, r]));
      const byKey = new Map(
        existing.map((r) => [key(r.size, r.color_name), r]),
      );
      const kept = new Set<string>();

      for (const v of variants) {
        const size = v.size;
        const color = v.colorName;
        const row =
          (v.id ? byId.get(v.id) : undefined) ?? byKey.get(key(size, color));
        if (row && !kept.has(row.id)) {
          kept.add(row.id);
          await tx.orm.public.product_variants.where({ id: row.id }).update({
            size,
            color_name: color,
            color_hex: v.colorHex,
          });
          if (v.baseStock === undefined) {
            await tx.orm.public.product_variants
              .where({ id: row.id })
              .update({ stock: v.stock });
          } else if (v.stock !== v.baseStock) {
            await adjustStock(tx, row.id, v.stock - v.baseStock, {
              clamp: true,
            });
          }
        } else if (!row) {
          await tx.orm.public.product_variants.create({
            id: uuidv7(),
            product_id: productId,
            size,
            color_name: color,
            color_hex: v.colorHex,
            stock: v.stock,
          });
        }
      }

      const stale = existing.filter((r) => !kept.has(r.id)).map((r) => r.id);
      if (stale.length > 0) {
        await tx.orm.public.product_variants
          .where((r) => r.id.in(stale))
          .deleteAndCount();
      }
    });
  }

  if (media !== undefined) {
    // Recycle only images actually dropped from the gallery — reused URLs
    // (same image kept across the edit) must stay where they are.
    const existing = await db.orm.public.product_media
      .where({ product_id: productId })
      .all();
    const keptUrls = new Set(media.map((m) => m.url));
    const removed = existing.filter((m) => !keptUrls.has(m.url));
    await Promise.all(
      removed.map((m) =>
        moveToRecycleBinByUrl(m.url, m.type === "video" ? "video" : "image"),
      ),
    );

    await db.orm.public.product_media
      .where({ product_id: productId })
      .deleteAndCount();
    let position = 0;
    for (const m of media) {
      await db.orm.public.product_media.create({
        id: uuidv7(),
        product_id: productId,
        type: m.type,
        url: m.url,
        poster_url: m.posterUrl ?? null,
        position: position++,
      });
    }
  }
}

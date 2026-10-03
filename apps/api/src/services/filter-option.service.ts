import type {
  FilterOption,
  FilterOptionKind,
  CreateFilterOptionPayload,
  UpdateFilterOptionPayload,
} from "@ecommerce/contracts";
import { db } from "../prisma/db.js";
import { nowUtc } from "../utils/datetime.util.js";
import { uuidv7 } from "../utils/uuid.util.js";
import { createHttpError } from "../utils/response.util.js";
import { cacheDel, cacheGet, cacheSet } from "../utils/redis.util.js";
import { config } from "../config.js";

const FILTER_OPTIONS_CACHE_KEY = "filter-options:all";

function rowToFilterOption(row: {
  id: string;
  kind: string;
  name: string;
  slug: string;
  hex: string | null;
  parent_id: string | null;
  created_at: string;
}): FilterOption {
  return {
    id: row.id,
    kind: row.kind as FilterOptionKind,
    name: row.name,
    slug: row.slug,
    hex: row.hex,
    parentId: row.parent_id,
    createdAt: row.created_at,
  };
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Lists every kind at once (cached as a single list) — callers filter by kind client-side. */
export async function listFilterOptionsService(): Promise<FilterOption[]> {
  const cached = await cacheGet<FilterOption[]>(FILTER_OPTIONS_CACHE_KEY);
  if (cached) return cached;

  const rows = await db.orm.public.filter_options
    .orderBy((f) => f.kind.asc())
    .all();
  const options = rows.map(rowToFilterOption);
  await cacheSet(FILTER_OPTIONS_CACHE_KEY, options, config.cacheLongTtlSeconds);
  return options;
}

export async function createFilterOptionService(
  payload: CreateFilterOptionPayload,
): Promise<FilterOption> {
  const slug = slugify(payload.name);
  if (!slug)
    throw createHttpError(422, "Name must contain letters or numbers.");

  const parentId = payload.parentId ?? null;
  if (parentId && payload.kind !== "category") {
    throw createHttpError(422, "Only categories can have a parent.");
  }
  if (payload.hex && payload.kind !== "colour") {
    throw createHttpError(422, "Only colours can have a hex value.");
  }
  if (parentId) {
    const parent = await db.orm.public.filter_options
      .select("id")
      .where({ id: parentId, kind: "category" })
      .first();
    if (!parent) throw createHttpError(404, "Parent category not found.");
  }

  const existing = await db.orm.public.filter_options
    .select("id")
    .where({ kind: payload.kind, slug })
    .first();
  if (existing) throw createHttpError(409, "This option already exists.");

  const row = await db.orm.public.filter_options.create({
    id: uuidv7(),
    kind: payload.kind,
    name: payload.name.trim(),
    slug,
    hex: payload.hex ?? null,
    parent_id: parentId,
    created_at: nowUtc() as any,
  });
  await cacheDel(FILTER_OPTIONS_CACHE_KEY);
  return rowToFilterOption(row);
}

export async function updateFilterOptionService(
  id: string,
  payload: UpdateFilterOptionPayload,
): Promise<FilterOption> {
  const existing = await db.orm.public.filter_options.where({ id }).first();
  if (!existing) throw createHttpError(404, "Filter option not found.");

  const slug = slugify(payload.name);
  if (!slug)
    throw createHttpError(422, "Name must contain letters or numbers.");

  const parentId =
    payload.parentId === undefined ? existing.parent_id : payload.parentId;
  if (parentId && existing.kind !== "category") {
    throw createHttpError(422, "Only categories can have a parent.");
  }
  if (payload.hex && existing.kind !== "colour") {
    throw createHttpError(422, "Only colours can have a hex value.");
  }
  const hex = payload.hex === undefined ? existing.hex : payload.hex;
  if (parentId === id)
    throw createHttpError(422, "A category cannot be its own parent.");
  if (parentId) {
    const parent = await db.orm.public.filter_options
      .select("id")
      .where({ id: parentId, kind: "category" })
      .first();
    if (!parent) throw createHttpError(404, "Parent category not found.");
  }

  const duplicate = await db.orm.public.filter_options
    .select("id")
    .where({ kind: existing.kind, slug })
    .first();
  if (duplicate && duplicate.id !== id)
    throw createHttpError(409, "This option already exists.");

  await db.orm.public.filter_options.where({ id }).update({
    name: payload.name.trim(),
    slug,
    hex,
    parent_id: parentId,
  });
  await cacheDel(FILTER_OPTIONS_CACHE_KEY);
  return rowToFilterOption({
    ...existing,
    name: payload.name.trim(),
    slug,
    hex,
    parent_id: parentId,
  });
}

export async function deleteFilterOptionService(id: string): Promise<void> {
  const existing = await db.orm.public.filter_options
    .select("id", "kind")
    .where({ id })
    .first();
  if (!existing) throw createHttpError(404, "Filter option not found.");

  if (existing.kind === "condition") {
    const inUse = await db.orm.public.products
      .select("id")
      .where({ condition_id: id, deleted_at: null })
      .first();
    if (inUse)
      throw createHttpError(409, "This condition is used by products.");
  }

  await db.orm.public.filter_options.where({ id }).delete();
  await cacheDel(FILTER_OPTIONS_CACHE_KEY);
}

/**
 * How many products use each option, keyed by option id — drives the admin
 * "In use / Unused" filter. Products store category/brand/surface as the option's
 * slug, condition by id; variants store the size slug and the colour *name*.
 * (Counts are per product for the first four, per variant row for size/colour.)
 */
export async function filterOptionUsageService(): Promise<
  Record<string, number>
> {
  const live = () => db.orm.public.products.where({ deleted_at: null });
  const count = async (
    col: "category" | "brand" | "surface" | "condition_id",
  ) =>
    new Map(
      (
        await live()
          .groupBy(col)
          .aggregate((a) => ({ n: a.count() }))
      ).map((r) => [r[col] as string | null, r.n] as const),
    );
  const variantCount = async (col: "size" | "color_name") =>
    new Map(
      (
        await db.orm.public.product_variants
          .groupBy(col)
          .aggregate((a) => ({ n: a.count() }))
      ).map((r) => [r[col] as string | null, r.n] as const),
    );

  const [options, category, brand, surface, condition, size, colour] =
    await Promise.all([
      db.orm.public.filter_options.all(),
      count("category"),
      count("brand"),
      count("surface"),
      count("condition_id"),
      variantCount("size"),
      variantCount("color_name"),
    ]);

  const usage: Record<string, number> = {};
  for (const o of options) {
    usage[o.id] =
      (o.kind === "category" && (category.get(o.slug) ?? 0)) ||
      (o.kind === "brand" && (brand.get(o.slug) ?? 0)) ||
      (o.kind === "surface" && (surface.get(o.slug) ?? 0)) ||
      (o.kind === "condition" && (condition.get(o.id) ?? 0)) ||
      (o.kind === "size" && (size.get(o.slug) ?? 0)) ||
      (o.kind === "colour" && (colour.get(o.name) ?? 0)) ||
      0;
  }
  return usage;
}

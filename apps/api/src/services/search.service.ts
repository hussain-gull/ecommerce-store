import { formatMoney, type ProductSuggestion } from "@ecommerce/contracts";
import { db } from "../utils/db.util.js";

const LIMIT = 6;

// Typo tolerance: pg_trgm (longer words) + fuzzystrmatch edit distance (short
// words, where trigrams score too low). Created here (idempotent) because the
// ORM migrations can't express extensions.
export async function ensureSearchIndexes(): Promise<void> {
  await db.query("CREATE EXTENSION IF NOT EXISTS pg_trgm");
  await db.query("CREATE EXTENSION IF NOT EXISTS fuzzystrmatch");
  await db.query(
    "CREATE INDEX IF NOT EXISTS products_name_trgm_idx ON products USING gin (name gin_trgm_ops)",
  );
}

const likeEscape = (s: string) => s.replace(/[\\%_]/g, "\\$&");

type Row = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  price: string;
  sale_price: string | null;
  img: string | null;
};

// Substring hits (name/brand) plus fuzzy hits ("nkie" → Nike); prefix matches
// rank first, then closer trigram matches.
export async function suggestProductsService(
  q: string,
): Promise<ProductSuggestion[]> {
  const { rows } = await db.query<Row>(
    `SELECT p.id, p.name, p.slug, p.brand, p.price, p.sale_price,
            (SELECT m.url FROM product_media m
              WHERE m.product_id = p.id AND m.type = 'image'
              ORDER BY m.position LIMIT 1) AS img
       FROM products p
      WHERE p.is_published AND p.deleted_at IS NULL
        AND (p.name ILIKE '%' || $1 || '%'
          OR p.brand ILIKE '%' || $1 || '%'
          OR word_similarity($2, p.name) > 0.4
          OR EXISTS (
            SELECT 1 FROM unnest(string_to_array(
              lower(p.name || ' ' || coalesce(p.brand, '')), ' ')) w
             WHERE levenshtein(left(w, length($2)), lower($2))
                   <= CASE WHEN length($2) >= 4 THEN 2 ELSE 1 END))
      ORDER BY (p.name ILIKE $1 || '%') DESC,
               (p.name ILIKE '%' || $1 || '%') DESC,
               greatest(word_similarity($2, p.name),
                        word_similarity($2, coalesce(p.brand, ''))) DESC,
               p.id DESC
      LIMIT ${LIMIT}`,
    [likeEscape(q), q],
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    price: formatMoney(r.price),
    ...(r.sale_price ? { salePrice: formatMoney(r.sale_price) } : {}),
    img: r.img ?? "",
    ...(r.brand ? { brand: r.brand } : {}),
  }));
}

import { z } from "zod";
import type { CreateProductPayload, UpdateProductPayload } from "../product.js";

const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(200)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase letters, numbers, and hyphens only",
  );

// Decimal-as-string money field — matches the Decimal column type; never a float.
const moneySchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid price, e.g. 49.99");

// Size and colour are mandatory: stock, carts and orders all match a variant on
// (size, colour), so a variant missing either can never be sold reliably.
const productVariantSchema = z.object({
  id: z.string().uuid().optional(),
  size: z.string().min(1, "Choose a size").max(20),
  colorName: z.string().min(1, "Pick a colour").max(50),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour"),
  stock: z.number().int().min(0),
  baseStock: z.number().int().min(0).optional(),
});

const productMediaSchema = z.object({
  type: z.enum(["image", "video"]),
  url: z.string().url(),
  posterUrl: z.string().url().optional(),
});

export const createProductSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().min(1, "Description is required").max(5000),
  price: moneySchema,
  // Optional — omitted means "no sale". Forms must send undefined, not "".
  salePrice: moneySchema.optional(),
  sku: z.string().min(1, "SKU is required").max(50),
  category: z.string().min(1, "Category is required").max(100),
  brand: z.string().max(100).optional(),
  gender: z.enum(["Men", "Women", "Kids"]).optional(),
  surface: z.string().max(100).optional(),
  conditionId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  isPublished: z.boolean().optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  variants: z
    .array(productVariantSchema)
    .min(1, "Add at least one variant (size, colour, stock)")
    .max(50),
  media: z.array(productMediaSchema).max(20).optional(),
}) satisfies z.ZodType<CreateProductPayload>;

export const updateProductSchema =
  createProductSchema.partial() satisfies z.ZodType<UpdateProductPayload>;

export type CreateProductFormValues = z.infer<typeof createProductSchema>;
export type UpdateProductFormValues = z.infer<typeof updateProductSchema>;

// GET /admin/products?… — status tab, filters, sort and paging all run in Postgres.
export const adminProductsQuerySchema = z.object({
  status: z.enum(["published", "draft"]).optional(),
  q: z.string().trim().max(100).default(""),
  category: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  conditionId: z.string().uuid().optional(),
  /** in = any variant in stock · low = a variant with 1–LOW_STOCK_THRESHOLD left · out = nothing in stock. */
  stock: z.enum(["in", "low", "out"]).optional(),
  onSale: z.enum(["1"]).optional(),
  sort: z
    .enum(["newest", "oldest", "name", "price-asc", "price-desc"])
    .default("newest"),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type AdminProductsQuery = z.infer<typeof adminProductsQuerySchema>;

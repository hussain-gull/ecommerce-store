import { z } from "zod";
import { SHOP_SORTS, type ShopQuery } from "../shop";

const values = z.array(z.string().min(1).max(100)).max(50).default([]);
const price = z.number().int().min(0).max(100_000_000).optional();

export const shopQuerySchema = z.object({
  category: values,
  surface: values,
  size: values,
  brand: values,
  colour: values,
  condition: values,
  gender: values,
  q: z.string().trim().max(100).default(""),
  minPrice: price,
  maxPrice: price,
  sort: z.enum(SHOP_SORTS).default("default"),
  page: z.number().int().min(1).max(10_000).default(1),
}) satisfies z.ZodType<ShopQuery>;

export type ShopQueryFormValues = z.infer<typeof shopQuerySchema>;

export const SUGGEST_MIN_CHARS = 2;
export const suggestQuerySchema = z.object({
  q: z.string().trim().min(SUGGEST_MIN_CHARS).max(100),
});

import { z } from "zod";
import type { AddCartItemPayload, MergeCartPayload } from "../cart.js";

export const addCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  size: z.string().min(1, "Choose a size").max(20),
  color: z.string().min(1, "Choose a colour").max(50),
}) satisfies z.ZodType<AddCartItemPayload>;

// Lenient on purpose: one stale guest line must not fail the whole login merge.
const mergeItemSchema = addCartItemSchema.extend({
  size: z.string().max(20).optional(),
  color: z.string().max(50).optional(),
});

export const mergeCartSchema = z.object({
  items: z.array(mergeItemSchema).max(100),
}) satisfies z.ZodType<MergeCartPayload>;

export type AddCartItemFormValues = z.infer<typeof addCartItemSchema>;
export type MergeCartFormValues = z.infer<typeof mergeCartSchema>;

import { z } from "zod";
import type {
  AddWishlistItemPayload,
  MergeWishlistPayload,
} from "../customer.js";

export const addWishlistItemSchema = z.object({
  productId: z.string().uuid(),
}) satisfies z.ZodType<AddWishlistItemPayload>;

export const mergeWishlistSchema = z.object({
  items: z.array(addWishlistItemSchema).max(200),
}) satisfies z.ZodType<MergeWishlistPayload>;

export type AddWishlistItemFormValues = z.infer<typeof addWishlistItemSchema>;
export type MergeWishlistFormValues = z.infer<typeof mergeWishlistSchema>;

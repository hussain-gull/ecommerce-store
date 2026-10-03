import { z } from "zod";
import type { PlaceOrderPayload } from "../order.js";
import { createAddressSchema } from "./address.schema";

export const placeOrderSchema = z.object({
  idempotencyKey: z.string().uuid(),
  contactEmail: z.string().email("Enter a valid email").max(254),
  contactPhone: z.string().max(30).optional(),
  shippingAddress: createAddressSchema.omit({ label: true }),
  shippingMethod: z.enum(["standard", "express", "next-day"]),
  paymentScreenshotUrl: z.string().url(),
}) satisfies z.ZodType<PlaceOrderPayload>;

export type PlaceOrderFormValues = z.infer<typeof placeOrderSchema>;

// Admin fulfilment steps after payment is confirmed. "delivered" is what
// unlocks a customer's store review.
export const updateOrderStatusSchema = z.object({
  status: z.enum(["shipped", "delivered"]),
});

// GET /orders/admin?status=&q=&page=&limit= — filtering/paging happens in Postgres.
export const adminOrdersQuerySchema = z.object({
  status: z
    .enum(["pending", "processing", "shipped", "delivered", "cancelled"])
    .optional(),
  q: z.string().trim().max(100).default(""),
  /** Placed in [from, to) — ISO instants (the admin sends local-day boundaries). */
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
  shippingMethod: z.enum(["standard", "express", "next-day"]).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>;

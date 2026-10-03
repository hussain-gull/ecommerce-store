import { z } from "zod";

const hexSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Enter a hex colour, e.g. #252525")
  .nullable()
  .optional();
import type {
  CreateFilterOptionPayload,
  UpdateFilterOptionPayload,
} from "@ecommerce/contracts/filter-option";
import { FILTER_OPTION_KINDS } from "@ecommerce/contracts/filter-option";

export const createFilterOptionSchema = z.object({
  kind: z.enum(FILTER_OPTION_KINDS),
  name: z.string().min(1, "Name is required").max(100),
  hex: hexSchema,
  parentId: z.string().uuid().nullable().optional(),
}) satisfies z.ZodType<CreateFilterOptionPayload>;

export type CreateFilterOptionFormValues = z.infer<
  typeof createFilterOptionSchema
>;

export const updateFilterOptionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  hex: hexSchema,
  parentId: z.string().uuid().nullable().optional(),
}) satisfies z.ZodType<UpdateFilterOptionPayload>;

export type UpdateFilterOptionFormValues = z.infer<
  typeof updateFilterOptionSchema
>;

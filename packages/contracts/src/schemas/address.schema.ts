import { z } from "zod";
import type { CreateAddressPayload } from "../address.js";

export const createAddressSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  line1: z.string().min(1, "Address line 1 is required").max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1, "City is required").max(100),
  postcode: z.string().min(1, "Postcode is required").max(20),
  country: z.enum(["Pakistan"], { error: "Only Pakistan is supported." }),
  label: z.string().max(50).optional(),
}) satisfies z.ZodType<CreateAddressPayload>;

export type CreateAddressFormValues = z.infer<typeof createAddressSchema>;

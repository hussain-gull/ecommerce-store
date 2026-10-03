import { z } from "zod";
import type { ContactMessagePayload } from "../contact";
import { normalizePhone } from "../shared";

// ─── Single source of truth for contact-form validation rules ─────────────────
// Both the API (server-side) and the web app (client-side) import from here.

export const contactMessageSchema = z.object({
  name: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Full name must be 100 characters or fewer"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .transform(normalizePhone)
    .refine((v) => /^\+92\d{10}$/.test(v), {
      message:
        "Enter a valid Pakistani mobile number (e.g. 03XXXXXXXXXX or +923XXXXXXXXXX)",
    }),
  email: z
    .string()
    .min(1, "Email address is required")
    .max(50, "Email address must be 50 characters or fewer")
    .email("Invalid email address"),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(100, "Subject must be 100 characters or fewer"),
  message: z
    .string()
    .min(1, "Message is required")
    .max(3000, "Message must be 3000 characters or fewer"),
}) satisfies z.ZodType<ContactMessagePayload>;

// ─── Derived types ──────────────────────────────────────────────────────────

export type ContactMessageFormValues = z.infer<typeof contactMessageSchema>;

// GET /contact?… (admin) — status tab, search, date range and paging run in Postgres.
export const contactMessagesQuerySchema = z.object({
  status: z.enum(["new", "read"]).optional(),
  q: z.string().trim().max(100).default(""),
  /** Received in [from, to) — ISO instants (the admin sends local-day boundaries). */
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type ContactMessagesQuery = z.infer<typeof contactMessagesQuerySchema>;

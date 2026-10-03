import { z } from "zod";

// Whitelisted upload categories — each maps to one Cloudinary sub-folder.
// Keeping this a closed enum (rather than a free-text folder path) is what
// stops a caller from uploading into an arbitrary/attacker-chosen folder.
export const MEDIA_CATEGORIES = [
  "home-hero",
  "home-category",
  "home-bestseller",
  "about-story",
  "blog",
  "product",
  "review",
  "payment",
  "payment-qr",
] as const;

export const mediaUploadSchema = z.object({
  category: z.enum(MEDIA_CATEGORIES),
});

export const deleteMediaSchema = z.object({
  url: z.string().url(),
});

export type MediaCategory = (typeof MEDIA_CATEGORIES)[number];
export type MediaUploadFormValues = z.infer<typeof mediaUploadSchema>;
export type DeleteMediaFormValues = z.infer<typeof deleteMediaSchema>;

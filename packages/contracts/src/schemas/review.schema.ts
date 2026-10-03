import { z } from "zod";
import type { CreateReviewPayload } from "../review.js";

export const createReviewSchema = z.object({
  orderId: z.string().uuid(),
  rating: z.number().int().min(1, "Rating is required").max(5),
  comment: z.string().min(1, "Comment is required").max(2000),
  media: z
    .array(
      z.object({ type: z.enum(["image", "video"]), url: z.string().url() }),
    )
    .max(6)
    .optional(),
}) satisfies z.ZodType<CreateReviewPayload>;

export type CreateReviewFormValues = z.infer<typeof createReviewSchema>;

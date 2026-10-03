import { blogContentSchema } from "@ecommerce/contracts";
import { getDocument } from "./server-fetch";

// null when the blog page content isn't set up (or fails its schema) — pages
// render an "unavailable" state. API failures throw → error boundary.
export const getBlogContent = () =>
  getDocument("/api/v1/content/blog", blogContentSchema);

export function formatPostDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

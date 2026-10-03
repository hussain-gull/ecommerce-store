import {
  homeContentSchema,
  aboutUsContentSchema,
  contactUsContentSchema,
  conditionGuideContentSchema,
  type ApiResponseBody,
  type PaymentContent,
} from "@ecommerce/contracts";
import { apiClient } from "./axios";
import { getDocument } from "./server-fetch";

// Page copy lives in the database, so any of these can legitimately be missing
// (not seeded yet) → null, and the page renders an "unavailable" state. Each is
// validated against its contract schema so a stale/edited row can't crash a page.
// API down / 5xx throws (see server-fetch.ts) → error boundary.
export const getHomeContentApi = () =>
  getDocument("/api/v1/content/home", homeContentSchema);

export const getAboutContentApi = () =>
  getDocument("/api/v1/content/about", aboutUsContentSchema);

export const getContactContentApi = () =>
  getDocument("/api/v1/content/contact", contactUsContentSchema);

export const getConditionGuideApi = () =>
  getDocument("/api/v1/content/condition-guide", conditionGuideContentSchema);

// Client-side (react-query hook) — errors surface via the hook's isError.
export async function getPaymentContentApi(): Promise<PaymentContent> {
  const { data } = await apiClient.get<ApiResponseBody<PaymentContent>>(
    "/api/v1/content/payment",
  );
  return data.response.data[0]!;
}

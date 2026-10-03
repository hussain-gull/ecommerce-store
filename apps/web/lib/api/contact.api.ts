import type { ContactMessagePayload } from "@ecommerce/contracts";
import { apiClient } from "./axios";

export async function sendContactMessageApi(
  payload: ContactMessagePayload,
): Promise<void> {
  await apiClient.post("/api/v1/contact", payload);
}

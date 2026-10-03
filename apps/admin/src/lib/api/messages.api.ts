import type {
  ApiResponseBody,
  ContactMessage,
  ContactMessageCounts,
  ContactMessagesQuery,
  PaginationMeta,
} from "@ecommerce/contracts";
import { apiClient } from "./axios";

export type MessagesPage = { messages: ContactMessage[]; meta: PaginationMeta };

// Search, status, date range and paging run in the API (Postgres) — never in the browser.
export async function listContactMessagesApi(
  params: Partial<ContactMessagesQuery>,
): Promise<MessagesPage> {
  const { data } = await apiClient.get<ApiResponseBody<ContactMessage>>(
    "/api/v1/contact",
    { params },
  );
  return { messages: data.response.data, meta: data.response.paginationMeta! };
}

export async function getMessageCountsApi(): Promise<ContactMessageCounts> {
  const { data } = await apiClient.get<ApiResponseBody<ContactMessageCounts>>(
    "/api/v1/contact/counts",
  );
  return data.response.data[0]!;
}

export async function markMessageReadApi(id: string): Promise<ContactMessage> {
  const { data } = await apiClient.patch<ApiResponseBody<ContactMessage>>(
    `/api/v1/contact/${id}/read`,
  );
  return data.response.data[0]!;
}

import type {
  AdminOrder,
  AdminOrderCounts,
  AdminOrdersQuery,
  ApiResponseBody,
  PaginationMeta,
} from "@ecommerce/contracts";
import { apiClient } from "./axios";

export type AdminOrdersPage = { orders: AdminOrder[]; meta: PaginationMeta };

// Filtering, search and paging run in the API (Postgres) — never in the browser.
export async function listAdminOrdersApi(
  params: Partial<AdminOrdersQuery>,
): Promise<AdminOrdersPage> {
  const { data } = await apiClient.get<ApiResponseBody<AdminOrder>>(
    "/api/v1/orders/admin",
    { params },
  );
  return {
    orders: data.response.data,
    meta: data.response.paginationMeta!,
  };
}

export async function getAdminOrderCountsApi(): Promise<AdminOrderCounts> {
  const { data } = await apiClient.get<ApiResponseBody<AdminOrderCounts>>(
    "/api/v1/orders/admin/counts",
  );
  return data.response.data[0]!;
}

export async function confirmOrderApi(id: string): Promise<void> {
  await apiClient.patch(`/api/v1/orders/admin/${id}/confirm`);
}

export async function cancelOrderApi(id: string): Promise<void> {
  await apiClient.patch(`/api/v1/orders/admin/${id}/cancel`);
}

export async function setOrderStatusApi(
  id: string,
  status: "shipped" | "delivered",
): Promise<void> {
  await apiClient.patch(`/api/v1/orders/admin/${id}/status`, { status });
}

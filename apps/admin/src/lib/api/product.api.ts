import type {
  AdminProduct,
  AdminProductCounts,
  AdminProductsQuery,
  PaginationMeta,
  ApiResponseBody,
  CreateProductPayload,
  UpdateProductPayload,
} from "@ecommerce/contracts";
import { apiClient } from "./axios";

export type AdminProductsPage = {
  products: AdminProduct[];
  meta: PaginationMeta;
};

// Filtering, search, sort and paging run in the API (Postgres) — never in the browser.
export async function listAdminProductsApi(
  params: Partial<AdminProductsQuery>,
): Promise<AdminProductsPage> {
  const { data } = await apiClient.get<ApiResponseBody<AdminProduct>>(
    "/api/v1/admin/products",
    { params },
  );
  return { products: data.response.data, meta: data.response.paginationMeta! };
}

export async function getAdminProductCountsApi(): Promise<AdminProductCounts> {
  const { data } = await apiClient.get<ApiResponseBody<AdminProductCounts>>(
    "/api/v1/admin/products/counts",
  );
  return data.response.data[0]!;
}

export async function createProductApi(
  payload: CreateProductPayload,
): Promise<AdminProduct> {
  const { data } = await apiClient.post<ApiResponseBody<AdminProduct>>(
    "/api/v1/admin/products",
    payload,
  );
  return data.response.data[0]!;
}

export async function updateProductApi(
  id: string,
  payload: UpdateProductPayload,
): Promise<AdminProduct> {
  const { data } = await apiClient.patch<ApiResponseBody<AdminProduct>>(
    `/api/v1/admin/products/${id}`,
    payload,
  );
  return data.response.data[0]!;
}

export async function deleteProductApi(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/products/${id}`);
}

import type {
  FilterOption,
  ApiResponseBody,
  CreateFilterOptionPayload,
  UpdateFilterOptionPayload,
} from "@ecommerce/contracts";
import { apiClient } from "./axios";

export async function listFilterOptionsApi(): Promise<FilterOption[]> {
  const { data } = await apiClient.get<ApiResponseBody<FilterOption>>(
    "/api/v1/admin/filter-options",
  );
  return data.response.data;
}

export async function createFilterOptionApi(
  payload: CreateFilterOptionPayload,
): Promise<FilterOption> {
  const { data } = await apiClient.post<ApiResponseBody<FilterOption>>(
    "/api/v1/admin/filter-options",
    payload,
  );
  return data.response.data[0]!;
}

export async function updateFilterOptionApi(
  id: string,
  payload: UpdateFilterOptionPayload,
): Promise<FilterOption> {
  const { data } = await apiClient.patch<ApiResponseBody<FilterOption>>(
    `/api/v1/admin/filter-options/${id}`,
    payload,
  );
  return data.response.data[0]!;
}

export async function deleteFilterOptionApi(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/filter-options/${id}`);
}

/** Products using each option, keyed by option id (0 = unused). */
export async function getFilterOptionUsageApi(): Promise<
  Record<string, number>
> {
  const { data } = await apiClient.get<ApiResponseBody<Record<string, number>>>(
    "/api/v1/admin/filter-options/usage",
  );
  return data.response.data[0] ?? {};
}

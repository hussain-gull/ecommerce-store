import type {
  ApiResponseBody,
  SavedAddress,
  CreateAddressPayload,
} from "@ecommerce/contracts";
import { apiClient } from "./axios";

export async function listAddressesApi(): Promise<SavedAddress[]> {
  const { data } =
    await apiClient.get<ApiResponseBody<SavedAddress>>("/api/v1/addresses");
  return data.response.data;
}

export async function createAddressApi(
  payload: CreateAddressPayload,
): Promise<SavedAddress> {
  const { data } = await apiClient.post<ApiResponseBody<SavedAddress>>(
    "/api/v1/addresses",
    payload,
  );
  return data.response.data[0]!;
}

export async function deleteAddressApi(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/addresses/${id}`);
}

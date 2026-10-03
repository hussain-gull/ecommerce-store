import type {
  ApiResponseBody,
  CustomerOrder,
  PlaceOrderPayload,
  PlacedOrder,
} from "@ecommerce/contracts";
import { apiClient } from "./axios";

export async function uploadPaymentProofApi(
  file: File,
): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<ApiResponseBody<{ url: string }>>(
    "/api/v1/media/payment-upload",
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data.response.data[0]!;
}

export async function placeOrderApi(
  payload: PlaceOrderPayload,
): Promise<PlacedOrder> {
  const { data } = await apiClient.post<ApiResponseBody<PlacedOrder>>(
    "/api/v1/orders",
    payload,
  );
  return data.response.data[0]!;
}

export async function getMyOrdersApi(): Promise<CustomerOrder[]> {
  const { data } = await apiClient.get<ApiResponseBody<CustomerOrder>>(
    "/api/v1/orders/mine",
  );
  return data.response.data ?? [];
}

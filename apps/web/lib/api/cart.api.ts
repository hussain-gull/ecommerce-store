import type {
  ApiResponseBody,
  DbCartItem,
  AddCartItemPayload,
  MergeCartPayload,
} from "@ecommerce/contracts";
import { apiClient } from "./axios";

export async function getCartApi(): Promise<DbCartItem[]> {
  const { data } =
    await apiClient.get<ApiResponseBody<DbCartItem>>("/api/v1/cart");
  return data.response.data;
}

export async function addCartItemApi(
  payload: AddCartItemPayload,
): Promise<DbCartItem> {
  const { data } = await apiClient.post<ApiResponseBody<DbCartItem>>(
    "/api/v1/cart/items",
    payload,
  );
  return data.response.data[0]!;
}

export async function removeCartItemApi(
  productId: string,
  size?: string,
  color?: string,
): Promise<void> {
  const params: Record<string, string> = {};
  if (size) params["size"] = size;
  if (color) params["color"] = color;
  await apiClient.delete(`/api/v1/cart/items/${productId}`, { params });
}

export async function clearCartApi(): Promise<void> {
  await apiClient.delete("/api/v1/cart");
}

export async function mergeCartApi(
  payload: MergeCartPayload,
): Promise<DbCartItem[]> {
  const { data } = await apiClient.post<ApiResponseBody<DbCartItem>>(
    "/api/v1/cart/merge",
    payload,
  );
  return data.response.data;
}

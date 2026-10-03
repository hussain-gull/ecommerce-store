import type {
  ApiResponseBody,
  DbWishlistItem,
  AddWishlistItemPayload,
  MergeWishlistPayload,
} from "@ecommerce/contracts";
import { apiClient } from "./axios";

export async function getWishlistApi(): Promise<DbWishlistItem[]> {
  const { data } =
    await apiClient.get<ApiResponseBody<DbWishlistItem>>("/api/v1/wishlist");
  return data.response.data;
}

export async function addWishlistItemApi(
  payload: AddWishlistItemPayload,
): Promise<DbWishlistItem> {
  const { data } = await apiClient.post<ApiResponseBody<DbWishlistItem>>(
    "/api/v1/wishlist/items",
    payload,
  );
  return data.response.data[0]!;
}

export async function removeWishlistItemApi(productId: string): Promise<void> {
  await apiClient.delete(`/api/v1/wishlist/items/${productId}`);
}

export async function clearWishlistApi(): Promise<void> {
  await apiClient.delete("/api/v1/wishlist");
}

export async function mergeWishlistApi(
  payload: MergeWishlistPayload,
): Promise<DbWishlistItem[]> {
  const { data } = await apiClient.post<ApiResponseBody<DbWishlistItem>>(
    "/api/v1/wishlist/merge",
    payload,
  );
  return data.response.data;
}

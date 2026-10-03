import type {
  ApiResponseBody,
  StoreReview,
  CreateReviewPayload,
} from "@ecommerce/contracts";
import { apiClient } from "./axios";

export async function getStoreReviewsApi(): Promise<StoreReview[]> {
  const { data } =
    await apiClient.get<ApiResponseBody<StoreReview>>("/api/v1/reviews");
  return data.response.data;
}

export async function createReviewApi(
  payload: CreateReviewPayload,
): Promise<StoreReview> {
  const { data } = await apiClient.post<ApiResponseBody<StoreReview>>(
    "/api/v1/reviews",
    payload,
  );
  return data.response.data[0]!;
}

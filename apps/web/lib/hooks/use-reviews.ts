"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiErrorBody, CreateReviewPayload } from "@ecommerce/contracts";
import { getStoreReviewsApi, createReviewApi } from "../api/review.api";
import {
  uploadReviewMediaApi,
  deleteReviewMediaApi,
} from "../api/review-media.api";
import { useToastStore } from "../store/toast.store";

export function useStoreReviews() {
  return useQuery({
    queryKey: ["store-reviews"],
    queryFn: getStoreReviewsApi,
  });
}

/** Store-wide average rating — reviews aren't per-product, so every product
 * card/detail page shows this instead of a fabricated per-product rating. */
export function useStoreRating() {
  const { data } = useStoreReviews();
  const reviews = data ?? [];
  const count = reviews.length;
  const rating =
    count === 0 ? 0 : reviews.reduce((s, r) => s + r.rating, 0) / count;
  return { rating: Math.round(rating), count };
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const push = useToastStore((s) => s.push);

  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => createReviewApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-reviews"] });
      push("success", "Review submitted.");
    },
    onError: (err: ApiErrorBody) => {
      push("error", err?.message ?? "Failed to submit review.");
    },
  });
}

export function useUploadReviewMedia() {
  const push = useToastStore((s) => s.push);

  return useMutation({
    mutationFn: (file: File) => uploadReviewMediaApi(file),
    onError: (err: ApiErrorBody) => {
      push("error", err?.message ?? "Failed to upload file.");
    },
  });
}

export function useDeleteReviewMedia() {
  return useMutation({
    mutationFn: (url: string) => deleteReviewMediaApi(url),
  });
}

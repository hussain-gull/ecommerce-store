import type { ApiResponseBody } from "@ecommerce/contracts";
import { apiClient } from "./axios";

type UploadedMedia = { url: string };

export async function uploadReviewMediaApi(file: File): Promise<UploadedMedia> {
  const form = new FormData();
  form.append("file", file);

  const { data } = await apiClient.post<ApiResponseBody<UploadedMedia>>(
    file.type.startsWith("video/")
      ? "/api/v1/media/review-upload-video"
      : "/api/v1/media/review-upload",
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data.response.data[0]!;
}

export async function deleteReviewMediaApi(url: string): Promise<void> {
  await apiClient.delete("/api/v1/media/review-upload", { data: { url } });
}

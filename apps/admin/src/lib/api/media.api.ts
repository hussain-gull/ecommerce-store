import type { ApiResponseBody, MediaCategory } from "@ecommerce/contracts";
import { apiClient } from "./axios";

type UploadedImage = { url: string };

export async function uploadMediaApi(
  file: File,
  category: MediaCategory,
): Promise<UploadedImage> {
  const form = new FormData();
  form.append("file", file);
  form.append("category", category);

  const { data } = await apiClient.post<ApiResponseBody<UploadedImage>>(
    file.type.startsWith("video/")
      ? "/api/v1/media/upload-video"
      : "/api/v1/media/upload",
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data.response.data[0]!;
}

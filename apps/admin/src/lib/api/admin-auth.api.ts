import type {
  ApiResponseBody,
  AdminUser,
  LoginPayload,
} from "@ecommerce/contracts";
import { apiClient } from "./axios";

type AdminAuthData = { user: AdminUser; accessToken: string };

export async function adminLoginApi(
  payload: LoginPayload,
): Promise<AdminAuthData> {
  const { data } = await apiClient.post<ApiResponseBody<AdminAuthData>>(
    "/api/v1/admin/auth/login",
    payload,
  );
  return data.response.data[0]!;
}

export async function adminLogoutApi(): Promise<void> {
  await apiClient.post("/api/v1/admin/auth/logout");
}

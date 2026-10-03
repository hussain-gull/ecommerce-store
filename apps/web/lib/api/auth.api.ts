import type {
  ApiResponseBody,
  SignupPayload,
  LoginPayload,
  AuthUser,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from "@ecommerce/contracts";
import { apiClient } from "./axios";

type AuthData = { user: AuthUser; accessToken: string };

export async function signupApi(payload: SignupPayload): Promise<AuthData> {
  const { data } = await apiClient.post<ApiResponseBody<AuthData>>(
    "/api/v1/auth/register",
    payload,
  );
  return data.response.data[0]!;
}

export async function loginApi(payload: LoginPayload): Promise<AuthData> {
  const { data } = await apiClient.post<ApiResponseBody<AuthData>>(
    "/api/v1/auth/login",
    payload,
  );
  return data.response.data[0]!;
}

export async function logoutApi(): Promise<void> {
  await apiClient.post("/api/v1/auth/logout");
}

export async function forgotPasswordApi(
  payload: ForgotPasswordPayload,
): Promise<void> {
  await apiClient.post("/api/v1/auth/forgot-password", payload);
}

export async function resetPasswordApi(
  payload: ResetPasswordPayload,
): Promise<void> {
  await apiClient.post("/api/v1/auth/reset-password", payload);
}

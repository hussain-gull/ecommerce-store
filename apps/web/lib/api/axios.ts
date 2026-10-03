import axios, { type InternalAxiosRequestConfig } from "axios";
import type { ApiErrorBody } from "@ecommerce/contracts";

// No "use client": the browser-only bits (auth store, refresh) are all guarded
// by `typeof window`, so Server Components can use this client for public reads.
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ── request interceptor ───────────────────────────────────────────────────────
// Attach the in-memory access token as a Bearer header on every outgoing request.
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const { useAuthStore } = require("../store/auth.store");
    const token: string | null = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── silent refresh interceptor ────────────────────────────────────────────────
// On 401, call /auth/refresh (sends the HttpOnly refresh_token cookie automatically),
// store the new access token in memory, then retry the original request.
// Concurrent 401s are queued — only one refresh call is made at a time.

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };
type QueueEntry = {
  resolve: (token: string) => void;
  reject: (reason: unknown) => void;
};

let isRefreshing = false;
let queue: QueueEntry[] = [];

function processQueue(token: string | null, error: unknown = null) {
  queue.forEach(({ resolve, reject }) =>
    token ? resolve(token) : reject(error),
  );
  queue = [];
}

const SESSION_EXPIRED: ApiErrorBody = {
  success: false,
  statusCode: 401,
  message: "Session expired. Please log in again.",
  errors: [],
};

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err?.config as RetryableConfig | undefined;
    const status: number | undefined = err?.response?.status;

    // Pass through: non-401s, already-retried requests, and auth endpoints
    // (avoids infinite loop if refresh itself returns 401)
    if (status !== 401 || config?._retry || config?.url?.includes("/auth/")) {
      const data = err?.response?.data as ApiErrorBody | undefined;
      return Promise.reject(
        data ?? {
          success: false,
          statusCode: status ?? 500,
          message: "Network error.",
          errors: [],
        },
      );
    }

    if (config) config._retry = true;

    // Queue this request behind an already-running refresh
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then((token) => {
        if (config) config.headers.Authorization = `Bearer ${token}`;
        return apiClient(config!);
      });
    }

    isRefreshing = true;

    try {
      // Use fetch directly to avoid a circular import with auth.api.ts
      const baseUrl = apiClient.defaults.baseURL ?? "http://localhost:4000";
      const res = await axios.post(`${baseUrl}/api/v1/auth/refresh`, null, {
        withCredentials: true,
      });

      const accessToken: string = res.data.response.data[0].accessToken;

      if (typeof window !== "undefined") {
        const { useAuthStore } = require("../store/auth.store");
        useAuthStore.getState().setAccessToken(accessToken);
      }

      processQueue(accessToken);
      if (config) config.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(config!);
    } catch {
      processQueue(null, SESSION_EXPIRED);

      if (typeof window !== "undefined") {
        const { useAuthStore } = require("../store/auth.store");
        useAuthStore.getState().clearAuth();
      }

      return Promise.reject(SESSION_EXPIRED);
    } finally {
      isRefreshing = false;
    }
  },
);

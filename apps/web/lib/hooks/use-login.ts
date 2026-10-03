"use client";

import { useMutation } from "@tanstack/react-query";
import type { ApiErrorBody, LoginPayload } from "@ecommerce/contracts";
import { loginApi } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";
import { useToastStore } from "../store/toast.store";
import { mergeAndHydrate } from "../utils/hydrate-stores";

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const push = useToastStore((s) => s.push);

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginApi(payload),
    onSuccess: async ({ user, accessToken }) => {
      // Set auth first so the API interceptor attaches the Bearer token on the merge calls.
      setAuth(user, accessToken);
      push("success", `Welcome back, ${user.firstName}!`);
      // Best-effort merge: upload any guest cart/wishlist, then hydrate stores.
      mergeAndHydrate().catch(() => {});
    },
    onError: (err: ApiErrorBody) => {
      push("error", err?.message ?? "Something went wrong.");
    },
  });
}

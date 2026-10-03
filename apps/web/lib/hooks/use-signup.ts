"use client";

import { useMutation } from "@tanstack/react-query";
import type { ApiErrorBody, SignupPayload } from "@ecommerce/contracts";
import { signupApi } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";
import { useToastStore } from "../store/toast.store";
import { mergeAndHydrate } from "../utils/hydrate-stores";
import { branding } from "@ecommerce/contracts";

export function useSignup() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const push = useToastStore((s) => s.push);

  return useMutation({
    mutationFn: (payload: SignupPayload) => signupApi(payload),
    onSuccess: async ({ user, accessToken }) => {
      setAuth(user, accessToken);
      push(
        "success",
        `Welcome to ${branding.storeName}! Your account has been created.`,
      );
      // Best-effort: upload any items added while browsing as a guest.
      mergeAndHydrate().catch(() => {});
    },
    onError: (err: ApiErrorBody) => {
      push("error", err?.message ?? "Something went wrong.");
    },
  });
}

import { useMutation } from "@tanstack/react-query";
import type { ApiErrorBody, LoginPayload } from "@ecommerce/contracts";
import { adminLoginApi } from "../api/admin-auth.api";
import { useAdminAuthStore } from "../store/admin-auth.store";
import { useToastStore } from "../store/toast.store";

export function useAdminLogin() {
  const setAuth = useAdminAuthStore((s) => s.setAuth);
  const push = useToastStore((s) => s.push);

  return useMutation({
    mutationFn: (payload: LoginPayload) => adminLoginApi(payload),
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken);
      push("success", `Welcome back, ${user.name}!`);
    },
    onError: (err: ApiErrorBody) => {
      push("error", err?.message ?? "Something went wrong.");
    },
  });
}

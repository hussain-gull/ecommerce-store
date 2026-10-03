"use client";

import { useMutation } from "@tanstack/react-query";
import type { ResetPasswordPayload } from "@ecommerce/contracts";
import { resetPasswordApi } from "../api/auth.api";

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => resetPasswordApi(payload),
  });
}

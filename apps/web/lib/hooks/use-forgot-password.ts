"use client";

import { useMutation } from "@tanstack/react-query";
import type { ForgotPasswordPayload } from "@ecommerce/contracts";
import { forgotPasswordApi } from "../api/auth.api";

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => forgotPasswordApi(payload),
  });
}

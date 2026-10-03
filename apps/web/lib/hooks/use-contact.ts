"use client";

import { useMutation } from "@tanstack/react-query";
import type { ApiErrorBody, ContactMessagePayload } from "@ecommerce/contracts";
import { sendContactMessageApi } from "../api/contact.api";
import { useToastStore } from "../store/toast.store";

export function useSendContactMessage() {
  const push = useToastStore((s) => s.push);

  return useMutation({
    mutationFn: (payload: ContactMessagePayload) =>
      sendContactMessageApi(payload),
    onError: (err: ApiErrorBody) => {
      push("error", err?.message ?? "Failed to send message.");
    },
  });
}

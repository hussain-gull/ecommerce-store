"use client";

import { useQuery } from "@tanstack/react-query";
import { getPaymentContentApi } from "../api/content.api";

// Admin-editable JazzCash details (account, QR, support phone).
export function usePaymentContent() {
  return useQuery({
    queryKey: ["content", "payment"],
    queryFn: getPaymentContentApi,
    staleTime: 60_000,
  });
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiErrorBody, CreateAddressPayload } from "@ecommerce/contracts";
import {
  listAddressesApi,
  createAddressApi,
  deleteAddressApi,
} from "../api/addresses.api";
import { useToastStore } from "../store/toast.store";
import { useAuthStore } from "../store/auth.store";

const ADDRESSES_KEY = ["addresses"] as const;

export function useAddresses() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ADDRESSES_KEY,
    queryFn: listAddressesApi,
    enabled: !!user,
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  const push = useToastStore((s) => s.push);

  return useMutation({
    mutationFn: (payload: CreateAddressPayload) => createAddressApi(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADDRESSES_KEY });
      push("success", "Address saved successfully.");
    },
    onError: (err: ApiErrorBody) => {
      push("error", err?.message ?? "Failed to save address.");
    },
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  const push = useToastStore((s) => s.push);

  return useMutation({
    mutationFn: (id: string) => deleteAddressApi(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADDRESSES_KEY });
      push("success", "Address removed.");
    },
    onError: (err: ApiErrorBody) => {
      push("error", err?.message ?? "Failed to remove address.");
    },
  });
}

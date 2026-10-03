"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyOrdersApi } from "../api/order.api";
import { useAuthStore } from "../store/auth.store";

export const ORDERS_KEY = ["orders"] as const;

// Shared by the Overview count and the Orders tab, so switching tabs reuses one
// request. Checkout invalidates ORDERS_KEY, so a new order shows up immediately.
export function useMyOrders() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ORDERS_KEY,
    queryFn: getMyOrdersApi,
    enabled: !!user,
    staleTime: 60_000,
  });
}

import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type { AdminOrdersQuery, ApiErrorBody } from "@ecommerce/contracts";
import { useToastStore } from "../store/toast.store";
import {
  getAdminOrderCountsApi,
  listAdminOrdersApi,
  confirmOrderApi,
  cancelOrderApi,
  setOrderStatusApi,
} from "../api/orders.api";

const ORDERS_KEY = ["admin-orders"] as const;
const COUNTS_KEY = ["admin-order-counts"] as const;

export function useAdminOrders(params: Partial<AdminOrdersQuery>) {
  return useQuery({
    queryKey: [...ORDERS_KEY, params],
    queryFn: () => listAdminOrdersApi(params),
    // Keep the previous page on screen while the next filter/page loads.
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}

// One cheap GROUP BY — tab badges and the sidebar's "verify payment" badge.
export function useOrderCounts() {
  return useQuery({
    queryKey: COUNTS_KEY,
    queryFn: getAdminOrderCountsApi,
    refetchInterval: 60_000,
  });
}

// Orders waiting on payment verification — drives the sidebar badge.
export const usePendingOrderCount = () => useOrderCounts().data?.pending ?? 0;

const refreshOrders = (qc: QueryClient) => {
  qc.invalidateQueries({ queryKey: ORDERS_KEY });
  qc.invalidateQueries({ queryKey: COUNTS_KEY });
};

function useOrderAction(
  fn: (id: string) => Promise<void>,
  successMsg: string,
  failMsg: string,
) {
  const qc = useQueryClient();
  const push = useToastStore((s) => s.push);
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      push("success", successMsg);
      refreshOrders(qc);
    },
    onError: (err: ApiErrorBody) => push("error", err?.message ?? failMsg),
  });
}

export const useConfirmOrder = () =>
  useOrderAction(
    confirmOrderApi,
    "Order confirmed — customer emailed.",
    "Failed to confirm order.",
  );

export const useCancelOrder = () =>
  useOrderAction(
    cancelOrderApi,
    "Order cancelled — stock returned.",
    "Failed to cancel order.",
  );

export const useSetOrderStatus = () => {
  const qc = useQueryClient();
  const push = useToastStore((s) => s.push);
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "shipped" | "delivered";
    }) => setOrderStatusApi(id, status),
    onSuccess: (_d, { status }) => {
      push("success", `Order marked ${status}.`);
      refreshOrders(qc);
    },
    onError: (err: ApiErrorBody) =>
      push("error", err?.message ?? "Failed to update order."),
  });
};

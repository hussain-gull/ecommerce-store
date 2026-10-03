import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { ApiErrorBody, ContactMessagesQuery } from "@ecommerce/contracts";
import { useToastStore } from "../store/toast.store";
import {
  getMessageCountsApi,
  listContactMessagesApi,
  markMessageReadApi,
} from "../api/messages.api";

const MESSAGES_KEY = ["contact-messages"] as const;
const COUNTS_KEY = ["contact-message-counts"] as const;

export function useContactMessages(params: Partial<ContactMessagesQuery>) {
  return useQuery({
    queryKey: [...MESSAGES_KEY, params],
    queryFn: () => listContactMessagesApi(params),
    // Keep the previous page on screen while the next filter/page loads.
    placeholderData: keepPreviousData,
    // Tons of messages can come in — keep the list reasonably fresh.
    refetchInterval: 60_000,
  });
}

// One cheap GROUP BY — stat cards, tab badges and the sidebar's unread badge.
export function useMessageCounts() {
  return useQuery({
    queryKey: COUNTS_KEY,
    queryFn: getMessageCountsApi,
    refetchInterval: 60_000,
  });
}

export const useUnreadMessageCount = () => useMessageCounts().data?.new ?? 0;

export function useMarkMessageRead() {
  const qc = useQueryClient();
  const push = useToastStore((s) => s.push);

  return useMutation({
    mutationFn: (id: string) => markMessageReadApi(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MESSAGES_KEY });
      qc.invalidateQueries({ queryKey: COUNTS_KEY });
    },
    onError: (err: ApiErrorBody) => {
      push("error", err?.message ?? "Failed to mark message as read.");
    },
  });
}

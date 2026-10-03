import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ApiErrorBody,
  CreateFilterOptionPayload,
  UpdateFilterOptionPayload,
  FilterOption,
} from "@ecommerce/contracts";
import { useToastStore } from "../store/toast.store";
import {
  getFilterOptionUsageApi,
  listFilterOptionsApi,
  createFilterOptionApi,
  updateFilterOptionApi,
  deleteFilterOptionApi,
} from "../api/filter-option.api";

const FILTER_OPTIONS_KEY = ["filter-options"] as const;

/** Fetches every kind at once; components filter by kind (see `useFilterOptionsByKind`). */
export function useFilterOptions() {
  return useQuery({
    queryKey: FILTER_OPTIONS_KEY,
    queryFn: listFilterOptionsApi,
  });
}

/** How many products use each option (by option id) — for the In use / Unused filter. */
export function useFilterOptionUsage() {
  return useQuery({
    queryKey: ["filter-option-usage"],
    queryFn: getFilterOptionUsageApi,
  });
}

export function useFilterOptionsByKind(kind: FilterOption["kind"]) {
  const query = useFilterOptions();
  return {
    ...query,
    data: query.data?.filter((o) => o.kind === kind) ?? [],
  };
}

export function useCreateFilterOption() {
  const qc = useQueryClient();
  const push = useToastStore((s) => s.push);

  return useMutation({
    mutationFn: (payload: CreateFilterOptionPayload) =>
      createFilterOptionApi(payload),
    onSuccess: (created) => {
      qc.setQueryData<FilterOption[]>(FILTER_OPTIONS_KEY, (old) =>
        [...(old ?? []), created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      push("success", "Filter option created.");
    },
    onError: (err: ApiErrorBody) => {
      push("error", err?.message ?? "Failed to create filter option.");
    },
  });
}

export function useUpdateFilterOption() {
  const qc = useQueryClient();
  const push = useToastStore((s) => s.push);

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateFilterOptionPayload;
    }) => updateFilterOptionApi(id, payload),
    onSuccess: (updated) => {
      qc.setQueryData<FilterOption[]>(FILTER_OPTIONS_KEY, (old) =>
        old
          ?.map((o) => (o.id === updated.id ? updated : o))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      push("success", "Filter option updated.");
    },
    onError: (err: ApiErrorBody) => {
      push("error", err?.message ?? "Failed to update filter option.");
    },
  });
}

export function useDeleteFilterOption() {
  const qc = useQueryClient();
  const push = useToastStore((s) => s.push);

  return useMutation({
    mutationFn: (id: string) => deleteFilterOptionApi(id),
    onSuccess: (_void, id) => {
      qc.setQueryData<FilterOption[]>(FILTER_OPTIONS_KEY, (old) =>
        old?.filter((o) => o.id !== id),
      );
      push("success", "Filter option deleted.");
    },
    onError: (err: ApiErrorBody) => {
      push("error", err?.message ?? "Failed to delete filter option.");
    },
  });
}

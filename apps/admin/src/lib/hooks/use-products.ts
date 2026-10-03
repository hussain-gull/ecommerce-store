import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  AdminProductsQuery,
  ApiErrorBody,
  CreateProductPayload,
  UpdateProductPayload,
} from "@ecommerce/contracts";
import { useToastStore } from "../store/toast.store";
import {
  getAdminProductCountsApi,
  listAdminProductsApi,
  createProductApi,
  updateProductApi,
  deleteProductApi,
} from "../api/product.api";

const PRODUCTS_KEY = ["products"] as const;
const COUNTS_KEY = ["product-counts"] as const;

export function useProducts(params: Partial<AdminProductsQuery>) {
  return useQuery({
    queryKey: [...PRODUCTS_KEY, params],
    queryFn: () => listAdminProductsApi(params),
    // Keep the previous page on screen while the next filter/page loads.
    placeholderData: keepPreviousData,
  });
}

export function useProductCounts() {
  return useQuery({ queryKey: COUNTS_KEY, queryFn: getAdminProductCountsApi });
}

// Any write can change which rows a filter matches and the tab counts.
const refresh = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: PRODUCTS_KEY });
  qc.invalidateQueries({ queryKey: COUNTS_KEY });
};

export function useCreateProduct() {
  const qc = useQueryClient();
  const push = useToastStore((s) => s.push);

  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProductApi(payload),
    onSuccess: () => {
      refresh(qc);
      push("success", "Product created.");
    },
    onError: (err: ApiErrorBody) => {
      push("error", err?.message ?? "Failed to create product.");
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  const push = useToastStore((s) => s.push);

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateProductPayload;
    }) => updateProductApi(id, payload),
    onSuccess: () => {
      refresh(qc);
      push("success", "Product updated.");
    },
    onError: (err: ApiErrorBody) => {
      push("error", err?.message ?? "Failed to update product.");
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  const push = useToastStore((s) => s.push);

  return useMutation({
    mutationFn: (id: string) => deleteProductApi(id),
    onSuccess: () => {
      refresh(qc);
      push("success", "Product deleted.");
    },
    onError: (err: ApiErrorBody) => {
      push("error", err?.message ?? "Failed to delete product.");
    },
  });
}

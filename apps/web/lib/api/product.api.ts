import type {
  ApiResponseBody,
  Product,
  ProductSuggestion,
  ProductDetail,
  ShopQuery,
  ShopQueryResult,
} from "@ecommerce/contracts";
import { apiClient } from "./axios";
import { getDocument, getList, toError } from "./server-fetch";

// Both run server-side (page.tsx is a Server Component). A missing product is
// null (page → notFound()); an empty catalogue is []. An API failure THROWS so
// the error boundary shows a retry — it must not masquerade as an empty shop.
// Callers that can degrade gracefully (e.g. the home page) catch it themselves.
export function getProductsApi(filters?: {
  category?: string;
}): Promise<Product[]> {
  return getList<Product>("/api/v1/products", filters);
}

export function getProductBySlugApi(
  slug: string,
): Promise<ProductDetail | null> {
  return getDocument<ProductDetail>(
    `/api/v1/products/${encodeURIComponent(slug)}`,
  );
}

// Filtering happens in the API. HTTP QUERY (not GET) because the filter set is
// too long for a URL; it's safe + idempotent, so it caches/retries like a GET.
// Works from Server Components (first paint) and the browser (filter clicks).
export async function queryShopApi(
  filters: ShopQuery,
  signal?: AbortSignal,
): Promise<ShopQueryResult> {
  const path = "/api/v1/products";
  try {
    const { data } = await apiClient.query<ApiResponseBody<ShopQueryResult>>(
      path,
      filters,
      { signal },
    );
    const result = data.response.data[0];
    if (!result) throw new Error("Empty shop query response.");
    return result;
  } catch (err) {
    throw toError(path, err);
  }
}

// Typeahead for the top-bar search; browser-only, abortable on every keystroke.
export async function suggestProductsApi(
  q: string,
  signal?: AbortSignal,
): Promise<ProductSuggestion[]> {
  const path = "/api/v1/products/suggest";
  try {
    const { data } = await apiClient.get<ApiResponseBody<ProductSuggestion>>(
      path,
      { params: { q }, signal },
    );
    return data.response.data;
  } catch (err) {
    throw toError(path, err);
  }
}

import { apiClient } from "../../../api/client";
import type {
  BufferStockFilters,
  BufferStockItem,
  UpdateBufferStockRequest,
} from "../types/bufferStock";

export function getBufferStocks(filters: BufferStockFilters) {
  const params = new URLSearchParams();

  if (filters.outletId) {
    params.set("outletId", filters.outletId);
  }

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  const query = params.toString();
  return apiClient.get<BufferStockItem[]>(`/api/bufferstocks${query ? `?${query}` : ""}`);
}

export function updateBufferStock(productId: string, payload: UpdateBufferStockRequest) {
  return apiClient.put<BufferStockItem>(`/api/bufferstocks/${productId}`, {
    outletId: payload.outletId,
    productId: payload.productId,
    productVariantId: payload.productVariantId ?? null,
    bufferQty: payload.bufferQty,
    isEnabled: payload.isEnabled,
  });
}

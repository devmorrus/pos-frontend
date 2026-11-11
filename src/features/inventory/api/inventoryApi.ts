import { apiClient } from "../../../api/client";
import type {
  CreateStockOpnameRequest,
  CreateStockTransferRequest,
  InventoryFilters,
  InventoryListItem,
  ReceiveStockTransferRequest,
  CreateStockReservationRequest,
  StockReservationDto,
  StockOpnameDto,
  StockTransferDto,
} from "../types/inventory";

export function getInventory(filters: InventoryFilters) {
  const params = new URLSearchParams();

  if (filters.stockLocationId) {
    params.set("stockLocationId", filters.stockLocationId);
  }

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.lowStockOnly) {
    params.set("lowStockOnly", "true");
  }

  if (filters.includeZeroStock === false) {
    params.set("includeZeroStock", "false");
  }

  const query = params.toString();
  return apiClient.get<InventoryListItem[]>(`/api/inventory${query ? `?${query}` : ""}`);
}

export function createStockReservation(payload: CreateStockReservationRequest) {
  return apiClient.post<StockReservationDto>("/api/stock-reservations", payload, {
    headers: { "Idempotency-Key": payload.id },
  });
}

export function getActiveStockReservations(filters: {
  stockLocationId: string;
  productId?: string;
  productVariantId?: string | null;
}) {
  const params = new URLSearchParams({ stockLocationId: filters.stockLocationId });
  if (filters.productId) params.set("productId", filters.productId);
  if (filters.productVariantId) params.set("productVariantId", filters.productVariantId);
  return apiClient.get<StockReservationDto[]>(`/api/stock-reservations?${params}`);
}

export function releaseStockReservation(id: string) {
  return apiClient.post<StockReservationDto>(`/api/stock-reservations/${id}/release`);
}

export function getStockOpnames(stockLocationId?: string | null) {
  const query = stockLocationId ? `?stockLocationId=${encodeURIComponent(stockLocationId)}` : "";
  return apiClient.get<StockOpnameDto[]>(`/api/stockopnames${query}`);
}

export function getStockOpnameById(id: string) {
  return apiClient.get<StockOpnameDto>(`/api/stockopnames/${id}`);
}

export function createStockOpname(payload: CreateStockOpnameRequest) {
  return apiClient.post<StockOpnameDto>("/api/stockopnames", payload);
}

export function getOutgoingStockTransfers(stockLocationId?: string | null) {
  const query = stockLocationId ? `?stockLocationId=${encodeURIComponent(stockLocationId)}` : "";
  return apiClient.get<StockTransferDto[]>(`/api/stocktransfers/outgoing${query}`);
}

export function getIncomingStockTransfers(stockLocationId?: string | null) {
  const query = stockLocationId ? `?stockLocationId=${encodeURIComponent(stockLocationId)}` : "";
  return apiClient.get<StockTransferDto[]>(`/api/stocktransfers/incoming${query}`);
}

export function getStockTransferById(id: string) {
  return apiClient.get<StockTransferDto>(`/api/stocktransfers/${id}`);
}

export function createStockTransfer(payload: CreateStockTransferRequest) {
  return apiClient.post<StockTransferDto>("/api/stocktransfers", payload, {
    headers: { "Idempotency-Key": payload.requestId },
  });
}

export function receiveStockTransfer(id: string, payload: ReceiveStockTransferRequest) {
  return apiClient.post<StockTransferDto>(`/api/stocktransfers/${id}/receive`, payload, {
    headers: { "Idempotency-Key": payload.requestId },
  });
}

export function approveStockTransfer(id: string) {
  return apiClient.post<StockTransferDto>(`/api/stocktransfers/${id}/approve`);
}

export function rejectStockTransfer(id: string) {
  return apiClient.post<StockTransferDto>(`/api/stocktransfers/${id}/reject`);
}

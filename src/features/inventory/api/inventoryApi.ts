import { apiClient } from "../../../api/client";
import type {
  CreateStockOpnameRequest,
  CreateStockTransferRequest,
  InventoryFilters,
  InventoryListItem,
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
  return apiClient.post<StockTransferDto>("/api/stocktransfers", payload);
}

export function approveStockTransfer(id: string) {
  return apiClient.post<StockTransferDto>(`/api/stocktransfers/${id}/approve`);
}

export function rejectStockTransfer(id: string) {
  return apiClient.post<StockTransferDto>(`/api/stocktransfers/${id}/reject`);
}

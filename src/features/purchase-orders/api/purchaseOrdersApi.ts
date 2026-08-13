import { apiClient } from "../../../api/client";
import type {
  CreatePurchaseOrderRequest,
  PurchaseOrderDto,
  PurchaseOrderFilters,
  UpdatePoStatusRequest,
} from "../types/purchaseOrder";

export function getPurchaseOrders(filters: PurchaseOrderFilters = {}) {
  const params = new URLSearchParams();

  if (filters.outletId) {
    params.set("outletId", filters.outletId);
  }

  const query = params.toString();
  return apiClient.get<PurchaseOrderDto[]>(`/api/purchaseorders${query ? `?${query}` : ""}`);
}

export function getPurchaseOrderById(id: string) {
  return apiClient.get<PurchaseOrderDto>(`/api/purchaseorders/${id}`);
}

export function createPurchaseOrder(payload: CreatePurchaseOrderRequest) {
  return apiClient.post<PurchaseOrderDto>("/api/purchaseorders", payload);
}

export function updatePurchaseOrderStatus(id: string, payload: UpdatePoStatusRequest) {
  return apiClient.put<PurchaseOrderDto>(`/api/purchaseorders/${id}/status`, payload);
}

export interface ReceivingItemRequest {
  productId: string;
  productVariantId?: string | null;
  qtyReceived: number;
  batchNumber?: string | null;
  expiryDate?: string | null;
}

export interface ReceiveGoodsRequest {
  outletId: string;
  notes?: string | null;
  items: ReceivingItemRequest[];
}

export function receivePurchaseOrderGoods(id: string, payload: ReceiveGoodsRequest) {
  return apiClient.post<PurchaseOrderDto>(`/api/purchaseorders/${id}/receive`, payload);
}

import { apiClient } from "../../../api/client";
import type {
  CreateSupplierReturnRequest,
  SupplierReturnDto,
  SupplierReturnFilters,
  SupplierReturnItemDto,
  SupplierReturnListItemDto,
  SupplierReturnPurchaseOrderLookupDto,
  UpdateSupplierReturnRequest,
  UpdateSupplierReturnStatusRequest,
} from "../types/supplierReturn";

export function getSupplierReturns(filters: SupplierReturnFilters = {}) {
  const params = new URLSearchParams();
  if (filters.outletId) params.set("outletId", filters.outletId);
  if (filters.supplierId) params.set("supplierId", filters.supplierId);
  if (filters.purchaseOrderId) params.set("purchaseOrderId", filters.purchaseOrderId);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);

  const query = params.toString();
  return apiClient.get<SupplierReturnListItemDto[]>(`/api/supplierreturns${query ? `?${query}` : ""}`);
}

export function getSupplierReturnById(id: string) {
  return apiClient.get<SupplierReturnDto>(`/api/supplierreturns/${id}`);
}

export function getEligibleSupplierReturnPurchaseOrders(params: { outletId: string; supplierId?: string }) {
  const search = new URLSearchParams();
  search.set("outletId", params.outletId);
  if (params.supplierId) search.set("supplierId", params.supplierId);
  return apiClient.get<SupplierReturnPurchaseOrderLookupDto[]>(
    `/api/supplierreturns/eligible-purchase-orders?${search.toString()}`,
  );
}

export function getEligibleSupplierReturnItems(purchaseOrderId: string) {
  return apiClient.get<SupplierReturnItemDto[]>(
    `/api/supplierreturns/purchase-orders/${purchaseOrderId}/eligible-items`,
  );
}

export function createSupplierReturn(payload: CreateSupplierReturnRequest) {
  return apiClient.post<SupplierReturnDto>("/api/supplierreturns", payload);
}

export function updateSupplierReturn(id: string, payload: UpdateSupplierReturnRequest) {
  return apiClient.put<SupplierReturnDto>(`/api/supplierreturns/${id}`, payload);
}

export function updateSupplierReturnStatus(id: string, payload: UpdateSupplierReturnStatusRequest) {
  return apiClient.post<SupplierReturnDto>(`/api/supplierreturns/${id}/status`, payload);
}

export function deleteSupplierReturn(id: string) {
  return apiClient.delete<void>(`/api/supplierreturns/${id}`);
}

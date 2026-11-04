import { apiClient } from "../../../api/client";
import type {
  CreateSupplierPaymentRequest,
  SupplierDebtDto,
  SupplierDebtFilters,
  SupplierPaymentDto,
  SupplierPaymentFilters,
} from "../types/debt";

export function getSupplierDebts(filters: SupplierDebtFilters) {
  const params = new URLSearchParams();

  if (filters.outletId) {
    params.set("outletId", filters.outletId);
  }

  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }

  const query = params.toString();
  return apiClient.get<SupplierDebtDto[]>(`/api/supplierdebts${query ? `?${query}` : ""}`);
}

export function getSupplierDebtByPoId(purchaseOrderId: string) {
  return apiClient.get<SupplierDebtDto>(`/api/supplierdebts/by-po/${purchaseOrderId}`);
}

export function getSupplierPayments(filters: SupplierPaymentFilters) {
  const params = new URLSearchParams();

  if (filters.outletId) {
    params.set("outletId", filters.outletId);
  }

  const query = params.toString();
  return apiClient.get<SupplierPaymentDto[]>(`/api/supplierdebts/payments${query ? `?${query}` : ""}`);
}

export function paySupplierDebt(payload: CreateSupplierPaymentRequest) {
  return apiClient.post<SupplierPaymentDto>("/api/supplierdebts/pay", payload, {
    headers: { "Idempotency-Key": payload.id },
  });
}

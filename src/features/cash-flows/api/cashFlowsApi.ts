import { apiClient } from "../../../api/client";
import type {
  CashFlowDetailDto,
  CashFlowFilterValues,
  CashFlowListItemDto,
  CreateBusinessCashFlowRequest,
} from "../types/cashFlow";

export function getCashFlows(trxType: "in" | "out", filters: CashFlowFilterValues = {}) {
  const params = new URLSearchParams();
  params.set("trxType", trxType);

  if (filters.keyword) params.set("keyword", filters.keyword);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.outletId) params.set("outletId", filters.outletId);
  if (filters.chartOfAccountId) params.set("chartOfAccountId", filters.chartOfAccountId);

  return apiClient.get<CashFlowListItemDto[]>(`/api/cash-flows?${params.toString()}`);
}

export function getCashFlowById(id: string) {
  return apiClient.get<CashFlowDetailDto>(`/api/cash-flows/${id}`);
}

export function createBusinessIncome(payload: CreateBusinessCashFlowRequest) {
  return apiClient.post<CashFlowDetailDto>("/api/cash-flows/income-business", payload);
}

export function createBusinessOutcome(payload: CreateBusinessCashFlowRequest) {
  return apiClient.post<CashFlowDetailDto>("/api/cash-flows/outcome-business", payload);
}

export function uploadCashFlowAttachment(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post<{ url: string }>("/api/cash-flows/upload-attachment", formData);
}

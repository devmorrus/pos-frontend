import { apiClient } from "../../../api/client";
import type {
  ChartOfAccountDto,
  CreateChartOfAccountRequest,
  UpdateChartOfAccountRequest,
  UpdateChartOfAccountStatusRequest,
} from "../types/chartOfAccount";

export function getChartOfAccounts() {
  return apiClient.get<ChartOfAccountDto[]>("/api/chart-of-accounts");
}

export function getChartOfAccountById(id: string) {
  return apiClient.get<ChartOfAccountDto>(`/api/chart-of-accounts/${id}`);
}

export function createChartOfAccount(payload: CreateChartOfAccountRequest) {
  return apiClient.post<ChartOfAccountDto>("/api/chart-of-accounts", payload);
}

export function updateChartOfAccount(id: string, payload: UpdateChartOfAccountRequest) {
  return apiClient.put<ChartOfAccountDto>(`/api/chart-of-accounts/${id}`, payload);
}

export function updateChartOfAccountStatus(id: string, payload: UpdateChartOfAccountStatusRequest) {
  return apiClient.patch<ChartOfAccountDto>(`/api/chart-of-accounts/${id}/status`, payload);
}

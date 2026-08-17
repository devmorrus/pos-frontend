import { apiClient } from "../../../api/client";
import type {
  CashierSessionDto,
  CloseSessionRequest,
  OpenSessionRequest,
  CreatePettyCashRequest,
  PettyCashExpenseDto,
} from "../types/cashier";

export function getCurrentCashierSession(outletId?: string | null) {
  const search = outletId ? `?outletId=${encodeURIComponent(outletId)}` : "";
  return apiClient.get<CashierSessionDto | null>(`/api/cashier-sessions/current${search}`);
}

export function openCashierSession(payload: OpenSessionRequest) {
  return apiClient.post<CashierSessionDto>("/api/cashier-sessions/open", payload);
}

export function closeCashierSession(id: string, payload: CloseSessionRequest) {
  return apiClient.post<CashierSessionDto>(`/api/cashier-sessions/close/${id}`, payload);
}

export function recordPettyCash(sessionId: string, payload: CreatePettyCashRequest) {
  return apiClient.post<PettyCashExpenseDto>(`/api/cashier-sessions/${sessionId}/petty-cash`, payload);
}

export function getPettyCashExpenses(sessionId: string) {
  return apiClient.get<PettyCashExpenseDto[]>(`/api/cashier-sessions/${sessionId}/petty-cash`);
}

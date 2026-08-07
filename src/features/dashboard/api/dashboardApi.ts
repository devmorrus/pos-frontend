import { apiClient } from "../../../api/client";
import type { DashboardSummaryDto, RoleDashboardDto } from "../types/dashboard";

export function getDashboardSummary(params: {
  outletId?: string;
  startDate: string;
  endDate: string;
}) {
  const query = new URLSearchParams();
  if (params.outletId) {
    query.append("outletId", params.outletId);
  }
  query.append("startDate", params.startDate);
  query.append("endDate", params.endDate);

  return apiClient.get<DashboardSummaryDto>(`/api/dashboard/summary?${query.toString()}`);
}

export function getRoleDashboardSummary(params: {
  outletId?: string;
  startDate: string;
  endDate: string;
}) {
  const query = new URLSearchParams();
  if (params.outletId) {
    query.append("outletId", params.outletId);
  }
  query.append("startDate", params.startDate);
  query.append("endDate", params.endDate);

  return apiClient.get<RoleDashboardDto>(`/api/dashboard/role-summary?${query.toString()}`);
}

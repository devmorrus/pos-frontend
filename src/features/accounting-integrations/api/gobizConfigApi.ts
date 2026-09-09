import { apiClient } from "../../../api/client";
import type {
  GoBizClientConfigDto,
  GoBizConfigDebugDto,
  UpsertGoBizClientConfigRequest,
} from "../types/gobiz";

export function getGoBizConfig(businessId: string) {
  return apiClient.get<GoBizClientConfigDto>(`/api/gobiz/config?businessId=${encodeURIComponent(businessId)}`);
}

export function saveGoBizConfig(payload: UpsertGoBizClientConfigRequest) {
  return apiClient.put<GoBizClientConfigDto>("/api/gobiz/config", payload);
}

export function getGoBizConfigDebug(params: { businessId?: string; outletId?: string }) {
  const qs = new URLSearchParams();
  if (params.businessId) qs.set("businessId", params.businessId);
  if (params.outletId) qs.set("outletId", params.outletId);
  return apiClient.get<GoBizConfigDebugDto>(`/api/gobiz/config/debug?${qs.toString()}`);
}

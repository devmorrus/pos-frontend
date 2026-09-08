import { apiClient } from "../../../api/client";
import type {
  GoBizConnectUrlRequest,
  GoBizConnectUrlResponse,
  GoBizConnectionStatusDto,
} from "../types/gobiz";

export function createGoBizConnectUrl(payload: GoBizConnectUrlRequest) {
  return apiClient.post<GoBizConnectUrlResponse>("/api/gobiz/connect-url", payload);
}

export function getGoBizStatus(outletId: string) {
  return apiClient.get<GoBizConnectionStatusDto>(`/api/gobiz/status?outletId=${encodeURIComponent(outletId)}`);
}

export function disconnectGoBiz(outletId: string) {
  return apiClient.post<void>(`/api/gobiz/disconnect?outletId=${encodeURIComponent(outletId)}`);
}

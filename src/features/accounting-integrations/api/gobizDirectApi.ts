import { apiClient } from "../../../api/client";
import type {
  GoBizCatalogPreviewDto,
  GoBizCatalogSyncResultDto,
  GoBizDirectConnectRequest,
  GoBizDirectStatusDto,
  GoBizDirectTokenStatusDto,
  GoBizExternalCatalogDto,
  GoBizIntegrationLogDto,
  GoBizOrderInboxDto,
} from "../types/gobiz";

export function getGoBizDirectStatus(outletId: string) {
  return apiClient.get<GoBizDirectStatusDto>(`/api/gobiz/direct/status?outletId=${encodeURIComponent(outletId)}`);
}

export function connectGoBizDirect(payload: GoBizDirectConnectRequest) {
  return apiClient.post<GoBizDirectStatusDto>("/api/gobiz/direct/connect", payload);
}

export function disconnectGoBizDirect(outletId: string) {
  return apiClient.post<void>(`/api/gobiz/direct/disconnect?outletId=${encodeURIComponent(outletId)}`);
}

export function testGoBizDirectToken(outletId: string) {
  return apiClient.get<GoBizDirectTokenStatusDto>(`/api/gobiz/direct/token/test?outletId=${encodeURIComponent(outletId)}`);
}

export function getGoBizExternalCatalog(outletId: string) {
  return apiClient.get<GoBizExternalCatalogDto>(`/api/gobiz/direct/catalog/external?outletId=${encodeURIComponent(outletId)}`);
}

export function previewGoBizCatalog(outletId: string) {
  return apiClient.get<GoBizCatalogPreviewDto>(`/api/gobiz/direct/catalog/preview?outletId=${encodeURIComponent(outletId)}`);
}

export function syncGoBizCatalog(outletId: string) {
  return apiClient.post<GoBizCatalogSyncResultDto>(`/api/gobiz/direct/catalog/sync?outletId=${encodeURIComponent(outletId)}`);
}

export function getGoBizLogs(outletId: string) {
  return apiClient.get<GoBizIntegrationLogDto[]>(`/api/gobiz/direct/logs?outletId=${encodeURIComponent(outletId)}`);
}

export function getGoBizOrders(outletId: string) {
  return apiClient.get<GoBizOrderInboxDto[]>(`/api/gobiz/direct/orders?outletId=${encodeURIComponent(outletId)}`);
}

export interface GoBizConnectUrlRequest {
  outletId: string;
}

export interface GoBizConnectUrlResponse {
  authorizationUrl: string;
  state: string;
  expiresAtUtc: string;
}

export interface GoBizConnectionStatusDto {
  outletId: string;
  isConnected: boolean;
  isActive: boolean;
  connectedAtUtc: string | null;
  expiresAtUtc: string | null;
  externalMerchantId: string | null;
  scope: string | null;
}

export interface GoBizDirectConnectRequest {
  outletId: string;
  goBizOutletId: string;
  partnerId?: string | null;
}

export interface GoBizDirectStatusDto {
  outletId: string;
  goBizOutletId: string | null;
  environment: string;
  isConnected: boolean;
  isActive: boolean;
  lastCatalogPulledAtUtc: string | null;
  lastCatalogSyncedAtUtc: string | null;
  lastCatalogSyncStatus: string | null;
  lastCatalogSyncMessage: string | null;
  lastWebhookAtUtc: string | null;
}

export interface GoBizDirectTokenStatusDto {
  success: boolean;
  tokenType: string;
  scope: string;
  expiresAtUtc: string;
}

export interface GoBizExternalCatalogDto {
  outletId: string;
  goBizOutletId: string;
  catalog: unknown;
  pulledAtUtc: string;
}

export interface GoBizCatalogPreviewDto {
  outletId: string;
  goBizOutletId: string;
  categoryCount: number;
  itemCount: number;
  validationErrors: string[];
  payload: unknown;
}

export interface GoBizCatalogSyncResultDto {
  outletId: string;
  goBizOutletId: string;
  success: boolean;
  message: string;
  categoryCount: number;
  itemCount: number;
  syncedAtUtc: string;
  response: unknown | null;
}

export interface GoBizIntegrationLogDto {
  id: string;
  serviceName: string;
  statusCode: string | null;
  isSuccess: boolean;
  errorMessage: string | null;
  createdAt: string;
}

export interface GoBizOrderInboxDto {
  id: string;
  goBizOrderId: string;
  outletId: string;
  eventType: string;
  status: string;
  transactionId: string | null;
  errorMessage: string | null;
  receivedAtUtc: string;
  processedAtUtc: string | null;
}

export interface GoBizClientConfigDto {
  businessId: string;
  environment: string;
  clientId: string;
  hasClientSecret: boolean;
  partnerId: string;
  authorizationUrl: string;
  tokenUrl: string;
  apiBaseUrl: string;
  redirectUri: string;
  scope: string;
  userType: string;
  prompt: string;
  hasWebhookSecret: boolean;
  isActive: boolean;
  source: string;
  updatedAt: string | null;
}

export interface UpsertGoBizClientConfigRequest {
  businessId: string;
  environment: string;
  clientId: string;
  clientSecret?: string | null;
  partnerId: string;
  authorizationUrl: string;
  tokenUrl: string;
  apiBaseUrl: string;
  redirectUri: string;
  scope: string;
  userType?: string | null;
  prompt?: string | null;
  webhookSecret?: string | null;
  isActive: boolean;
}

export interface GoBizConfigDebugDto {
  businessId: string;
  environment: string;
  authorizationUrl: string;
  tokenUrl: string;
  apiBaseUrl: string;
  redirectUri: string;
  clientIdConfigured: boolean;
  clientSecretConfigured: boolean;
  partnerIdConfigured: boolean;
  webhookSecretConfigured: boolean;
  source: string;
}

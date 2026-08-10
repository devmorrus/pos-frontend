import { apiClient } from "../../../api/client";
import type {
  ChannelAccountDto,
  ChannelSettlementDto,
  ChannelSettlementEligibleTransactionDto,
  ChannelSettlementFilters,
  ChannelSettlementListItemDto,
  CreateChannelAccountRequest,
  CreateChannelSettlementRequest,
  UpdateChannelAccountRequest,
  UpdateChannelSettlementRequest,
  UpdateChannelSettlementStatusRequest,
} from "../types/channel";

export function getChannelAccounts(outletId?: string | null) {
  const params = new URLSearchParams();
  if (outletId) params.set("outletId", outletId);
  const query = params.toString();
  return apiClient.get<ChannelAccountDto[]>(`/api/channelaccounts${query ? `?${query}` : ""}`);
}

export function createChannelAccount(payload: CreateChannelAccountRequest) {
  return apiClient.post<ChannelAccountDto>("/api/channelaccounts", payload);
}

export function updateChannelAccount(id: string, payload: UpdateChannelAccountRequest) {
  return apiClient.put<ChannelAccountDto>(`/api/channelaccounts/${id}`, payload);
}

export function getChannelSettlements(filters: ChannelSettlementFilters = {}) {
  const params = new URLSearchParams();
  if (filters.outletId) params.set("outletId", filters.outletId);
  if (filters.channelAccountId) params.set("channelAccountId", filters.channelAccountId);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  const query = params.toString();
  return apiClient.get<ChannelSettlementListItemDto[]>(`/api/channelsettlements${query ? `?${query}` : ""}`);
}

export function getChannelSettlementById(id: string) {
  return apiClient.get<ChannelSettlementDto>(`/api/channelsettlements/${id}`);
}

export function getEligibleChannelTransactions(params: {
  channelAccountId: string;
  periodStartDate: string;
  periodEndDate: string;
  excludeSettlementId?: string;
}) {
  const search = new URLSearchParams({
    channelAccountId: params.channelAccountId,
    periodStartDate: params.periodStartDate,
    periodEndDate: params.periodEndDate,
  });
  if (params.excludeSettlementId) search.set("excludeSettlementId", params.excludeSettlementId);
  return apiClient.get<ChannelSettlementEligibleTransactionDto[]>(
    `/api/channelsettlements/eligible-transactions?${search.toString()}`,
  );
}

export function createChannelSettlement(payload: CreateChannelSettlementRequest) {
  return apiClient.post<ChannelSettlementDto>("/api/channelsettlements", payload);
}

export function updateChannelSettlement(id: string, payload: UpdateChannelSettlementRequest) {
  return apiClient.put<ChannelSettlementDto>(`/api/channelsettlements/${id}`, payload);
}

export function updateChannelSettlementStatus(id: string, payload: UpdateChannelSettlementStatusRequest) {
  return apiClient.post<ChannelSettlementDto>(`/api/channelsettlements/${id}/status`, payload);
}

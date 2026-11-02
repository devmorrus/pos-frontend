import { apiClient, publicClient } from "../../../api/client";
import type {
  CapabilityChangeLog,
  CapabilityOverrideItem,
  CapabilitySnapshot,
  IndustryProfile,
} from "../types/capability";

export function getIndustryProfiles() {
  return publicClient.get<IndustryProfile[]>("/api/public/industry-profiles");
}

export function getEffectiveCapabilities(outletId?: string | null) {
  const query = outletId ? `?outletId=${encodeURIComponent(outletId)}` : "";
  return apiClient.get<CapabilitySnapshot>(`/api/capabilities/effective${query}`);
}

export function getCapabilityConfiguration(outletId?: string | null) {
  const query = outletId ? `?outletId=${encodeURIComponent(outletId)}` : "";
  return apiClient.get<CapabilitySnapshot>(`/api/capabilities/configuration${query}`);
}

export function updateBusinessCapability(
  revision: number,
  reason: string,
  items: CapabilityOverrideItem[],
) {
  return apiClient.put<CapabilitySnapshot>("/api/capabilities/business-overrides", {
    expectedRevision: revision,
    reason,
    items,
  });
}

export function updateOutletCapability(
  outletId: string,
  revision: number,
  reason: string,
  items: CapabilityOverrideItem[],
) {
  return apiClient.put<CapabilitySnapshot>(
    `/api/capabilities/outlets/${outletId}/overrides`,
    { expectedRevision: revision, reason, items },
  );
}

export function updateIndustryProfile(profileCode: string, revision: number, reason: string) {
  return apiClient.put<CapabilitySnapshot>("/api/capabilities/industry-profile", {
    profileCode,
    expectedRevision: revision,
    reason,
  });
}

export function getCapabilityHistory(take = 50) {
  return apiClient.get<CapabilityChangeLog[]>(`/api/capabilities/history?take=${take}`);
}

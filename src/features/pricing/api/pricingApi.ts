import { apiClient } from "../../../api/client";
import type {
  PricingPreviewRequest,
  PricingBreakdownDto,
  PromoCampaignDto,
  ServiceChargeRuleDto,
  TaxRuleDto,
  VoucherDto,
} from "../types/pricing";

export function previewPricing(payload: PricingPreviewRequest) {
  return apiClient.post<PricingBreakdownDto>("/api/transactions/pricing-preview", payload);
}

export function getTaxRules(outletId?: string) {
  const query = outletId ? `?outletId=${outletId}` : "";
  return apiClient.get<TaxRuleDto[]>(`/api/tax-rules${query}`);
}

export function createTaxRule(payload: {
  outletId: string;
  name: string;
  rate: number;
  isActive: boolean;
  appliesBeforeServiceCharge: boolean;
}) {
  return apiClient.post<TaxRuleDto>("/api/tax-rules", payload);
}

export function updateTaxRule(id: string, payload: {
  outletId: string;
  name: string;
  rate: number;
  isActive: boolean;
  appliesBeforeServiceCharge: boolean;
}) {
  return apiClient.put<TaxRuleDto>(`/api/tax-rules/${id}`, payload);
}

export function getServiceChargeRules(outletId?: string) {
  const query = outletId ? `?outletId=${outletId}` : "";
  return apiClient.get<ServiceChargeRuleDto[]>(`/api/service-charge-rules${query}`);
}

export function createServiceChargeRule(payload: {
  outletId: string;
  name: string;
  rate: number;
  isActive: boolean;
}) {
  return apiClient.post<ServiceChargeRuleDto>("/api/service-charge-rules", payload);
}

export function updateServiceChargeRule(id: string, payload: {
  outletId: string;
  name: string;
  rate: number;
  isActive: boolean;
}) {
  return apiClient.put<ServiceChargeRuleDto>(`/api/service-charge-rules/${id}`, payload);
}

export function getPromoCampaigns(outletId?: string) {
  const query = outletId ? `?outletId=${outletId}` : "";
  return apiClient.get<PromoCampaignDto[]>(`/api/promo-campaigns${query}`);
}

export function createPromoCampaign(payload: {
  outletId: string;
  code?: string | null;
  name: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  scopeType: "transaction" | "product" | "category";
  minimumSpend: number;
  maximumDiscountAmount?: number | null;
  startAt: string;
  endAt: string;
  isActive: boolean;
  targets: Array<{ productId?: string | null; categoryId?: string | null }>;
}) {
  return apiClient.post<PromoCampaignDto>("/api/promo-campaigns", payload);
}

export function updatePromoCampaign(id: string, payload: {
  outletId: string;
  code?: string | null;
  name: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  scopeType: "transaction" | "product" | "category";
  minimumSpend: number;
  maximumDiscountAmount?: number | null;
  startAt: string;
  endAt: string;
  isActive: boolean;
  targets: Array<{ productId?: string | null; categoryId?: string | null }>;
}) {
  return apiClient.put<PromoCampaignDto>(`/api/promo-campaigns/${id}`, payload);
}

export function getVouchers(outletId?: string) {
  const query = outletId ? `?outletId=${outletId}` : "";
  return apiClient.get<VoucherDto[]>(`/api/vouchers${query}`);
}

export function createVoucher(payload: {
  outletId: string;
  code: string;
  name: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  minimumSpend: number;
  maximumDiscountAmount?: number | null;
  usageLimitTotal: number;
  usageLimitPerCode: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
}) {
  return apiClient.post<VoucherDto>("/api/vouchers", payload);
}

export function updateVoucher(id: string, payload: {
  outletId: string;
  code: string;
  name: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  minimumSpend: number;
  maximumDiscountAmount?: number | null;
  usageLimitTotal: number;
  usageLimitPerCode: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
}) {
  return apiClient.put<VoucherDto>(`/api/vouchers/${id}`, payload);
}

export function activateVoucher(id: string) {
  return apiClient.post<VoucherDto>(`/api/vouchers/${id}/activate`, {});
}

export function deactivateVoucher(id: string) {
  return apiClient.post<VoucherDto>(`/api/vouchers/${id}/deactivate`, {});
}

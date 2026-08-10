export type PricingLineBreakdownDto = {
  productId: string;
  productName: string;
  qty: number;
  subtotal: number;
  manualDiscount: number;
  promoDiscount: number;
  voucherDiscount: number;
  serviceCharge: number;
  tax: number;
  lineGrandTotal: number;
};

export type AppliedVoucherDto = {
  voucherId: string;
  code: string;
  name: string;
  discountAmount: number;
};

export type AppliedPromoDto = {
  promoCampaignId: string;
  code: string | null;
  name: string;
  discountAmount: number;
};

export type PricingBreakdownDto = {
  subtotal: number;
  manualDiscountTotal: number;
  promoDiscountTotal: number;
  voucherDiscountTotal: number;
  serviceChargeTotal: number;
  taxTotal: number;
  grandTotal: number;
  appliedVoucher: AppliedVoucherDto | null;
  appliedPromo: AppliedPromoDto | null;
  lineBreakdowns: PricingLineBreakdownDto[];
};

export type PricingPreviewRequest = {
  outletId: string;
  channel: string;
  voucherCode?: string | null;
  selectedPromoCode?: string | null;
  items: {
    productId: string;
    qty: number;
    unitPrice: number;
    discountAmount: number;
  }[];
};

export type TaxRuleDto = {
  id: string;
  outletId: string;
  outletName: string;
  name: string;
  rate: number;
  isActive: boolean;
  appliesBeforeServiceCharge: boolean;
  updatedAt: string;
};

export type ServiceChargeRuleDto = {
  id: string;
  outletId: string;
  outletName: string;
  name: string;
  rate: number;
  isActive: boolean;
  updatedAt: string;
};

export type PromoCampaignTargetRequest = {
  productId?: string | null;
  categoryId?: string | null;
};

export type PromoCampaignDto = {
  id: string;
  outletId: string;
  outletName: string;
  code: string | null;
  name: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  scopeType: "transaction" | "product" | "category";
  minimumSpend: number;
  maximumDiscountAmount: number | null;
  startAt: string;
  endAt: string;
  isActive: boolean;
  productIds: string[];
  categoryIds: string[];
};

export type VoucherDto = {
  id: string;
  outletId: string;
  outletName: string;
  code: string;
  name: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  minimumSpend: number;
  maximumDiscountAmount: number | null;
  usageLimitTotal: number;
  usageLimitPerCode: number;
  usedCount: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
};

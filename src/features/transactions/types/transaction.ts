export type TransactionListItemDto = {
  id: string;
  transactionNumber: string;
  outletId: string;
  outletName: string;
  userId: string;
  userName: string;
  grandTotal: number;
  status: string;
  channel: string;
  createdAt: string;
  paymentSummary: string;
};

export type TransactionItemDto = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  qty: number;
  returnedQty: number;
  remainingQty: number;
  unitPrice: number;
  unitCost: number;
  discountAmount: number;
  lineTotal: number;
};

export type PaymentDto = {
  method: string;
  amount: number;
  referenceNumber: string | null;
  createdAt: string;
};

export type TransactionReturnDto = {
  id: string;
  transactionItemId: string;
  productId: string;
  productName: string;
  qty: number;
  reason: string | null;
  refundMethod: string;
  processedBy: string;
  processedByName: string;
  createdAt: string;
};

export type TransactionDto = {
  id: string;
  transactionNumber: string;
  outletId: string;
  outletName: string;
  userId: string;
  userName: string;
  cashierSessionId: string | null;
  channel: string;
  status: string;
  subtotal: number;
  discountTotal: number;
  manualDiscountTotal: number;
  promoDiscountTotal: number;
  voucherDiscountTotal: number;
  serviceChargeTotal: number;
  taxTotal: number;
  grandTotal: number;
  appliedVoucherCode: string | null;
  appliedPromoName: string | null;
  voidedBy: string | null;
  voidedByName: string | null;
  voidedReason: string | null;
  createdAt: string;
  pricingBreakdown: import("../../pricing/types/pricing").PricingBreakdownDto;
  items: TransactionItemDto[];
  payments: PaymentDto[];
  returns: TransactionReturnDto[];
};

export type CheckoutItemRequest = {
  productId: string;
  qty: number;
  unitPrice: number;
  discountAmount: number;
};

export type PaymentRequest = {
  method: string;
  amount: number;
  referenceNumber?: string | null;
};

export type CheckoutRequest = {
  id: string;
  outletId: string;
  cashierSessionId: string;
  channel: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  items: CheckoutItemRequest[];
  payments: PaymentRequest[];
  voucherCode?: string | null;
  appliedPromoCode?: string | null;
};

export type VoidTransactionRequest = {
  reason: string;
};

export type RefundTransactionItemRequest = {
  productId: string;
  qty: number;
};

export type RefundTransactionRequest = {
  refundMethod: "refund" | "exchange";
  reason?: string | null;
  items: RefundTransactionItemRequest[];
};

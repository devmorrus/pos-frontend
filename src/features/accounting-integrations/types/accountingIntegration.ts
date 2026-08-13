export type AccountingReferenceType =
  | "transaction_sale"
  | "purchase_order"
  | "supplier_payment"
  | "supplier_return"
  | "channel_settlement"
  | "consignment_settlement";

export interface AccountingPostingStatusDto {
  referenceType: string;
  referenceId: string;
  isPosted: boolean;
  entryCount: number;
  trxNumber: string | null;
  trxDate: string | null;
}

export interface AccountingBackfillRequest {
  dateFrom: string | null;
  dateTo: string | null;
  includeTransactions: boolean;
  includePurchaseOrders: boolean;
  includeSupplierPayments: boolean;
  includeSupplierReturns: boolean;
  includeChannelSettlements: boolean;
  includeConsignmentSettlements: boolean;
}

export interface AccountingBackfillResultDto {
  transactionsPosted: number;
  purchaseOrdersPosted: number;
  supplierPaymentsPosted: number;
  supplierReturnsPosted: number;
  channelSettlementsPosted: number;
  consignmentSettlementsPosted: number;
}

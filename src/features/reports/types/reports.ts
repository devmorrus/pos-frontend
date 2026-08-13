export interface ProfitLossCategorySummary {
  categoryId: string;
  categoryName: string;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
}

export interface AccountingCashFlowReportFilters {
  dateFrom?: string;
  dateTo?: string;
  outletId?: string;
  chartOfAccountId?: string;
  keyword?: string;
}

export interface AccountingCashFlowReportSummaryDto {
  openingBalance: number;
  cashIn: number;
  cashOut: number;
  closingBalance: number;
}

export interface AccountingCashFlowReportLineDto {
  accountTransactionId: string;
  trxDate: string;
  trxNumber: string;
  referenceType: string;
  referenceId: string | null;
  accountId: string;
  accountCode: string;
  accountName: string;
  outletId: string | null;
  outletName: string | null;
  note: string | null;
  debitAmount: number;
  creditAmount: number;
  movementAmount: number;
  runningBalance: number;
}

export interface AccountingCashFlowReportDto {
  filters: AccountingCashFlowReportFilters;
  summary: AccountingCashFlowReportSummaryDto;
  lines: AccountingCashFlowReportLineDto[];
}

export interface AccountingProfitLossReportFilters {
  dateFrom?: string;
  dateTo?: string;
  outletId?: string;
  keyword?: string;
}

export interface AccountingProfitLossAccountLineDto {
  chartOfAccountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  amount: number;
}

export interface AccountingProfitLossSectionDto {
  accountType: string;
  total: number;
  accounts: AccountingProfitLossAccountLineDto[];
}

export interface AccountingProfitLossReportSummaryDto {
  revenueTotal: number;
  cogsTotal: number;
  expenseTotal: number;
  grossProfit: number;
  netProfit: number;
}

export interface AccountingProfitLossReportDto {
  filters: AccountingProfitLossReportFilters;
  revenue: AccountingProfitLossSectionDto;
  cogs: AccountingProfitLossSectionDto;
  expense: AccountingProfitLossSectionDto;
  summary: AccountingProfitLossReportSummaryDto;
}

export interface ProfitLossReportDto {
  startDate: string;
  endDate: string;
  outletId: string | null;
  outletName: string;
  grossRevenue: number;
  totalDiscount: number;
  totalTax: number;
  netRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  categoryBreakdown: ProfitLossCategorySummary[];
}

export interface PurchaseProductSummary {
  productId: string;
  productName: string;
  sku: string;
  totalQty: number;
  averageUnitCost: number;
  totalSpent: number;
}

export interface PurchaseSupplierSummary {
  supplierId: string;
  supplierName: string;
  totalOrders: number;
  totalSpent: number;
}

export interface PurchaseRecapReportDto {
  startDate: string;
  endDate: string;
  outletId: string | null;
  outletName: string;
  totalSpent: number;
  totalOrdersCount: number;
  productBreakdown: PurchaseProductSummary[];
  supplierBreakdown: PurchaseSupplierSummary[];
}

export interface SalesProductSummary {
  productId: string;
  productName: string;
  sku: string;
  totalQty: number;
  totalRevenue: number;
  totalCostOfGoodsSold: number;
  totalGrossProfit: number;
}

export interface SalesPaymentSummary {
  paymentMethod: string;
  transactionCount: number;
  totalCollected: number;
}

export interface SalesRecapReportDto {
  startDate: string;
  endDate: string;
  outletId: string | null;
  outletName: string;
  grossRevenue: number;
  totalDiscount: number;
  netRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  productBreakdown: SalesProductSummary[];
  paymentBreakdown: SalesPaymentSummary[];
}

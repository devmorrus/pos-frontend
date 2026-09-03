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

export interface GeneralLedgerReportFilters {
  dateFrom?: string;
  dateTo?: string;
  outletId?: string;
  chartOfAccountId?: string;
  keyword?: string;
}

export interface GeneralLedgerReportSummaryDto {
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}

export interface GeneralLedgerReportLineDto {
  accountTransactionId: string;
  trxDate: string;
  trxNumber: string;
  referenceType: string;
  referenceId: string | null;
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  outletId: string | null;
  outletName: string | null;
  note: string | null;
  debitAmount: number;
  creditAmount: number;
  movementAmount: number;
  runningBalance: number;
}

export interface GeneralLedgerReportDto {
  filters: GeneralLedgerReportFilters;
  summary: GeneralLedgerReportSummaryDto;
  lines: GeneralLedgerReportLineDto[];
}

export interface SupplierReportFilters {
  dateFrom?: string;
  dateTo?: string;
  supplierId?: string;
  outletId?: string;
}

export interface SupplierReportSupplierDto {
  supplierId: string;
  supplierName: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isActive: boolean;
}

export interface SupplierReportSummaryDto {
  totalPurchase: number;
  totalPurchaseReturn: number;
  netPurchase: number;
  totalDebtPayment: number;
  outstandingDebt: number;
  consignmentReceivedValue: number;
  consignmentReturnValue: number;
  consignmentSalesValue: number;
  settlementValue: number;
}

export interface SupplierReportPurchaseDto {
  purchaseOrderId: string;
  poNumber: string;
  poDate: string;
  outletId: string;
  outletName: string;
  status: string;
  paymentType: string;
  totalAmount: number;
  dueDate: string | null;
}

export interface SupplierReportPurchaseReturnDto {
  returnId: string;
  returnNumber: string;
  returnDate: string;
  status: string;
  totalAmount: number;
  purchaseOrderId: string;
  poNumber: string;
  outletName?: string | null;
}

export interface SupplierReportDebtDto {
  debtId: string;
  purchaseOrderId: string;
  poNumber: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  outletName?: string | null;
}

export interface SupplierReportPaymentDto {
  paymentId: string;
  purchaseOrderId: string;
  poNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string | null;
  status: string;
  outletName?: string | null;
}

export interface SupplierReportConsignmentDto {
  consignmentId: string;
  consignmentNumber: string;
  receiveDate: string;
  status: string;
  totalValue: number;
  itemCount: number;
  outletName: string;
}

export interface SupplierReportConsignmentReturnDto {
  returnId: string;
  returnNumber: string;
  returnDate: string;
  status: string;
  totalQty: number;
  itemCount: number;
  outletName: string;
}

export interface SupplierReportConsignmentSaleDto {
  consignmentSaleId: string;
  transactionNumber: string;
  createdAt: string;
  productName: string;
  qty: number;
  unitCost: number;
  totalAmount: number;
  status: string;
  outletName: string;
}

export interface SupplierReportSettlementDto {
  settlementId: string;
  settlementNumber: string;
  settlementDate: string;
  totalAmount: number;
  status: string;
  salesCount: number;
  outletName: string;
}

export interface SupplierReportDto {
  filters: SupplierReportFilters;
  supplier: SupplierReportSupplierDto | null;
  summary: SupplierReportSummaryDto;
  purchases: SupplierReportPurchaseDto[];
  purchaseReturns: SupplierReportPurchaseReturnDto[];
  debts: SupplierReportDebtDto[];
  payments: SupplierReportPaymentDto[];
  consignments: SupplierReportConsignmentDto[];
  consignmentReturns: SupplierReportConsignmentReturnDto[];
  consignmentSales: SupplierReportConsignmentSaleDto[];
  settlements: SupplierReportSettlementDto[];
}

export interface StockCardReportFilters {
  dateFrom?: string;
  dateTo?: string;
  outletId?: string;
  productId?: string;
  productVariantId?: string;
}

export interface StockCardReportProductInfoDto {
  productId: string;
  productName: string;
  sku: string;
  productVariantId?: string | null;
  variantSku?: string | null;
  variantLabel?: string | null;
  hasVariants: boolean;
}

export interface StockCardReportSummaryDto {
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  closingBalance: number;
}

export interface StockCardReportLineDto {
  ledgerId: string;
  createdAt: string;
  productId: string;
  productName: string;
  sku: string;
  productVariantId?: string | null;
  variantSku?: string | null;
  movementType: string;
  movementLabel: string;
  referenceType: string;
  referenceId: string;
  referenceNumber?: string | null;
  note?: string | null;
  qtyChange: number;
  qtyIn: number;
  qtyOut: number;
  runningBalance: number;
  outletName: string;
}

export interface StockCardReportDto {
  filters: StockCardReportFilters;
  product: StockCardReportProductInfoDto;
  outletName: string;
  summary: StockCardReportSummaryDto;
  lines: StockCardReportLineDto[];
}


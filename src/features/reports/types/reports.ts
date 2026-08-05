export interface ProfitLossCategorySummary {
  categoryId: string;
  categoryName: string;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
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

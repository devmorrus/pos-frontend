export interface SalesTrendItem {
  date: string;
  salesAmount: number;
  transactionCount: number;
}

export interface PaymentMethodDistribution {
  method: string;
  amount: number;
  count: number;
}

export interface ChannelDistribution {
  channel: string;
  amount: number;
  count: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  sku: string;
  qtySold: number;
  totalRevenue: number;
}

export interface OutletSalesComparison {
  outletId: string;
  outletName: string;
  totalSales: number;
  totalTransactions: number;
}

export interface DashboardSummaryDto {
  totalSales: number;
  totalTransactions: number;
  averageOrderValue: number;
  grossProfit: number;
  grossMargin: number;
  salesTrend: SalesTrendItem[];
  paymentMethods: PaymentMethodDistribution[];
  salesChannels: ChannelDistribution[];
  topProducts: TopProduct[];
  outletComparisons: OutletSalesComparison[];
}

export interface RoleDashboardDto {
  role: string;
  ownerData?: DashboardSummaryDto;
  keuanganData?: KeuanganDashboardDto;
  gudangData?: GudangDashboardDto;
  kasirData?: KasirDashboardDto;
}

export interface KeuanganDashboardDto {
  cashOnHand: number;
  totalPurchases: number;
  totalSupplierDebt: number;
  upcomingDebts: UpcomingDebt[];
  topSuppliers: TopSupplier[];
  purchaseTrend: SalesTrendItem[];
}

export interface UpcomingDebt {
  supplierDebtId: string;
  supplierName: string;
  poNumber: string;
  dueDate: string;
  remainingAmount: number;
}

export interface TopSupplier {
  supplierId: string;
  supplierName: string;
  totalPurchaseAmount: number;
  poCount: number;
}

export interface GudangDashboardDto {
  totalProducts: number;
  lowStockAlertsCount: number;
  pendingPurchaseOrdersCount: number;
  activeConsignmentsCount: number;
  pendingStockTransfersCount: number;
  lowStockProducts: LowStockProduct[];
}

export interface LowStockProduct {
  productId: string;
  productName: string;
  sku: string;
  qtyOnHand: number;
  minStockAlert: number;
}

export interface KasirDashboardDto {
  activeSession: boolean;
  sessionId?: string;
  openingCash: number;
  totalSalesThisSession: number;
  totalTransactionsThisSession: number;
  paymentMethodsThisSession: PaymentMethodDistribution[];
  recentTransactions: RecentTransaction[];
}

export interface RecentTransaction {
  transactionId: string;
  invoiceNumber: string;
  createdAt: string;
  grandTotal: number;
  paymentMethod: string;
}

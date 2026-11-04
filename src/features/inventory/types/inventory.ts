export type InventoryListItem = {
  productId: string;
  productVariantId?: string | null;
  sku: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  barcode: string | null;
  unit: string;
  isConsignment: boolean;
  qtyOnHand: number;
  minStockAlert: number;
  isLowStock: boolean;
  costPrice: number;
  basePrice: number;
  updatedAt: string;
  trackingMode: "quantity" | "batch" | "serial";
  trackedItemCount: number;
};

export type InventoryFilters = {
  outletId?: string;
  search?: string;
  lowStockOnly?: boolean;
  includeZeroStock?: boolean;
};

export type StockOpnameItemDto = {
  productId: string;
  productVariantId?: string | null;
  productName: string;
  sku: string;
  systemQty: number;
  physicalQty: number;
  variance: number;
  productBatchId?: string | null;
  batchNumber?: string | null;
  productSerialId?: string | null;
  serialNumber?: string | null;
};

export type StockOpnameDto = {
  id: string;
  outletId: string;
  outletName: string;
  performedBy: string;
  performedByName: string;
  status: string;
  createdAt: string;
  items: StockOpnameItemDto[];
};

export type StockOpnameItemRequest = {
  productId: string;
  productVariantId?: string | null;
  physicalQty: number;
  productBatchId?: string | null;
  productSerialIds?: string[] | null;
};

export type CreateStockOpnameRequest = {
  outletId: string;
  items: StockOpnameItemRequest[];
};

export type StockTransferItemDto = {
  productId: string;
  productVariantId?: string | null;
  productName: string;
  sku: string;
  qty: number;
  productBatchId?: string | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
  productSerialId?: string | null;
  serialNumber?: string | null;
};

export type StockTransferDto = {
  id: string;
  fromOutletId: string;
  fromOutletName: string;
  toOutletId: string;
  toOutletName: string;
  transferNumber: string;
  status: string;
  requestedBy: string;
  requestedByName: string;
  approvedBy: string | null;
  approvedByName: string | null;
  createdAt: string;
  items: StockTransferItemDto[];
};

export type StockTransferItemRequest = {
  productId: string;
  productVariantId?: string | null;
  qty: number;
  productBatchId?: string | null;
  productSerialIds?: string[] | null;
};

export type CreateStockTransferRequest = {
  fromOutletId: string;
  toOutletId: string;
  items: StockTransferItemRequest[];
};

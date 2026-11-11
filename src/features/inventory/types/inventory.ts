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
  qtyReserved: number;
  qtyAvailable: number;
  qtySold: number;
  minStockAlert: number;
  isLowStock: boolean;
  costPrice: number;
  basePrice: number;
  updatedAt: string;
  trackingMode: "quantity" | "batch" | "serial";
  trackedItemCount: number;
};

export type InventoryFilters = {
  stockLocationId?: string;
  search?: string;
  lowStockOnly?: boolean;
  includeZeroStock?: boolean;
};

export type StockReservationItemDto = {
  id: string;
  productId: string;
  productVariantId: string | null;
  productName: string;
  sku: string;
  qty: number;
  trackingMode: "quantity" | "batch" | "serial";
  productBatchId: string | null;
  batchNumber: string | null;
  productSerialId: string | null;
  serialNumber: string | null;
  status: "active" | "consumed" | "released" | "expired";
};

export type StockReservationDto = {
  id: string;
  stockLocationId: string;
  stockLocationName: string;
  cashierSessionId: string | null;
  createdBy: string;
  createdByName: string;
  sourceType: string;
  status: "active" | "consumed" | "released" | "expired";
  expiresAt: string;
  resolvedAt: string | null;
  releaseReason: string | null;
  createdAt: string;
  items: StockReservationItemDto[];
};

export type CreateStockReservationRequest = {
  id: string;
  outletId: string;
  cashierSessionId: string;
  items: {
    productId: string;
    productVariantId?: string | null;
    qty: number;
    batchAllocations?: { productBatchId: string; qty: number }[] | null;
    serialIds?: string[] | null;
  }[];
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
  stockLocationId: string;
  stockLocationName: string;
  stockLocationType: "outlet" | "warehouse";
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
  stockLocationId: string;
  items: StockOpnameItemRequest[];
};

export type StockTransferItemDto = {
  id: string;
  productId: string;
  productVariantId?: string | null;
  productName: string;
  sku: string;
  qty: number;
  sentQty: number;
  receivedQty: number | null;
  differenceQty: number | null;
  varianceReasonCode: string | null;
  varianceNote: string | null;
  unitCostSnapshot: number;
  varianceValue: number | null;
  productBatchId?: string | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
  productSerialId?: string | null;
  serialNumber?: string | null;
};

export type StockTransferDto = {
  id: string;
  fromStockLocationId: string;
  fromStockLocationName: string;
  fromStockLocationType: "outlet" | "warehouse";
  fromOutletId: string | null;
  toStockLocationId: string;
  toStockLocationName: string;
  toStockLocationType: "outlet" | "warehouse";
  toOutletId: string | null;
  transferNumber: string;
  status: string;
  requestedBy: string;
  requestedByName: string;
  approvedBy: string | null;
  approvedByName: string | null;
  createdAt: string;
  receivedAt: string | null;
  receiptNote: string | null;
  hasVariance: boolean;
  totalSentQty: number;
  totalReceivedQty: number | null;
  totalDifferenceQty: number | null;
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
  requestId: string;
  fromStockLocationId: string;
  toStockLocationId: string;
  items: StockTransferItemRequest[];
};

export type ReceiveStockTransferRequest = {
  requestId: string;
  receiptNote: string | null;
  items: {
    transferItemId: string;
    receivedQty: number;
    varianceReasonCode: string | null;
    varianceNote: string | null;
  }[];
};

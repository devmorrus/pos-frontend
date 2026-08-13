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
};

export type CreateStockTransferRequest = {
  fromOutletId: string;
  toOutletId: string;
  items: StockTransferItemRequest[];
};

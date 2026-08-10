export type SupplierReturnItemDto = {
  productId: string;
  productName: string;
  sku: string;
  qty: number;
  unitCost: number;
  lineTotal: number;
  eligibleQty: number;
};

export type SupplierReturnListItemDto = {
  id: string;
  returnNumber: string;
  supplierId: string;
  supplierName: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  outletId: string;
  outletName: string;
  returnDate: string;
  totalAmount: number;
  status: string;
  createdByName: string;
};

export type SupplierReturnDto = SupplierReturnListItemDto & {
  notes: string | null;
  createdBy: string;
  items: SupplierReturnItemDto[];
};

export type SupplierReturnPurchaseOrderLookupDto = {
  id: string;
  poNumber: string;
  poDate: string;
  supplierId: string;
  supplierName: string;
  outletId: string;
  outletName: string;
  totalAmount: number;
};

export type SupplierReturnItemRequest = {
  productId: string;
  qty: number;
};

export type CreateSupplierReturnRequest = {
  supplierId: string;
  purchaseOrderId: string;
  returnDate: string;
  notes: string | null;
  items: SupplierReturnItemRequest[];
};

export type UpdateSupplierReturnRequest = {
  returnDate: string;
  notes: string | null;
  items: SupplierReturnItemRequest[];
};

export type UpdateSupplierReturnStatusRequest = {
  status: string;
};

export type SupplierReturnFilters = {
  outletId?: string | null;
  supplierId?: string;
  purchaseOrderId?: string;
  status?: string;
};

export type SupplierReturnFormRow = {
  productId: string;
  qty: string;
};

export type SupplierReturnFormValues = {
  supplierId: string;
  purchaseOrderId: string;
  returnDate: string;
  notes: string;
  items: SupplierReturnFormRow[];
};

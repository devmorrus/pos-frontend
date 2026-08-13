export type PurchaseOrderItemDto = {
  productId: string;
  productVariantId?: string | null;
  productName: string;
  sku: string;
  qty: number;
  qtyReceived: number;
  unitCost: number;
  totalCost: number;
  sellingPrice: number;
};

export type PurchaseOrderDto = {
  id: string;
  supplierId: string;
  supplierName: string;
  outletId: string;
  outletName: string;
  poNumber: string;
  poDate: string;
  paymentType: string;
  status: string;
  dueDate: string | null;
  totalAmount: number;
  items: PurchaseOrderItemDto[];
};

export type PurchaseOrderItemRequest = {
  productId: string;
  productVariantId?: string | null;
  qty: number;
  unitCost: number;
};

export type CreatePurchaseOrderRequest = {
  supplierId: string;
  outletId: string;
  paymentType: string;
  dueDate: string | null;
  items: PurchaseOrderItemRequest[];
};

export type UpdatePoStatusRequest = {
  status: string;
};

export type PurchaseOrderFilters = {
  outletId?: string | null;
};

export type PurchaseOrderFormRow = {
  productId: string;
  qty: string;
  unitCost: string;
};

export type PurchaseOrderFormValues = {
  supplierId: string;
  paymentType: "cash" | "tempo" | "consignment";
  dueDate: string;
  items: PurchaseOrderFormRow[];
};

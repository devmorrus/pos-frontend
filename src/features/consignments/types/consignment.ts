export type ConsignmentItemDto = {
  productId: string;
  productName: string;
  sku: string;
  qty: number;
  unitCost: number;
  unitPrice: number;
  soldQty?: number;
  returnedQty?: number;
};

export type ConsignmentDto = {
  id: string;
  supplierId: string;
  supplierName: string;
  outletId: string;
  outletName: string;
  consignmentNumber: string;
  receiveDate: string;
  status: "draft" | "received" | "cancelled" | string;
  items: ConsignmentItemDto[];
};

export type CreateConsignmentItemRequest = {
  productId: string;
  qty: number;
  unitCost: number;
  unitPrice: number;
};

export type CreateConsignmentRequest = {
  supplierId: string;
  outletId: string;
  items: CreateConsignmentItemRequest[];
};

export type UpdateConsignmentStatusRequest = {
  status: "received" | "cancelled" | string;
};

export type ConsignmentSaleDto = {
  id: string;
  supplierId: string;
  supplierName: string;
  transactionItemId: string;
  transactionNumber: string;
  productName: string;
  qty: number;
  unitCost: number;
  totalAmount: number;
  status: "unpaid" | "paid" | string;
  createdAt: string;
};

export type ConsignmentSettlementDto = {
  id: string;
  supplierId: string;
  supplierName: string;
  outletId: string;
  outletName: string;
  settlementNumber: string;
  settlementDate: string;
  totalAmount: number;
  status: "draft" | "settled" | "cancelled" | string;
  sales: ConsignmentSaleDto[];
};

export type CreateConsignmentSettlementRequest = {
  supplierId: string;
  outletId: string;
};

export type UpdateConsignmentSettlementStatusRequest = {
  status: "settled" | "cancelled" | string;
};

export type ConsignmentFormRow = {
  productId: string;
  qty: string;
  unitCost: string;
  unitPrice: string;
};

export type ConsignmentFormValues = {
  supplierId: string;
  items: ConsignmentFormRow[];
};

export type ConsignmentReturnItemDto = {
  productId: string;
  productName: string;
  sku: string;
  qty: number;
};

export type ConsignmentReturnDto = {
  id: string;
  supplierId: string;
  supplierName: string;
  outletId: string;
  outletName: string;
  returnNumber: string;
  returnDate: string;
  status: "draft" | "completed" | "cancelled" | string;
  items: ConsignmentReturnItemDto[];
};

export type CreateConsignmentReturnItemRequest = {
  productId: string;
  qty: number;
};

export type CreateConsignmentReturnRequest = {
  supplierId: string;
  outletId: string;
  items: CreateConsignmentReturnItemRequest[];
};

export type UpdateConsignmentReturnStatusRequest = {
  status: "completed" | "cancelled" | string;
};

export type ConsignmentReturnFormRow = {
  productId: string;
  qty: string;
};

export type ConsignmentReturnFormValues = {
  supplierId: string;
  items: ConsignmentReturnFormRow[];
};


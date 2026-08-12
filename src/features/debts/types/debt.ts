export type SupplierDebtDto = {
  id: string;
  supplierId: string;
  supplierName: string;
  purchaseOrderId: string;
  poNumber: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  soldAmount?: number;
  maxPayableAmount?: number;
};

export type SupplierPaymentDto = {
  id: string;
  supplierId: string;
  supplierName: string;
  purchaseOrderId: string;
  poNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string | null;
  status: string;
};

export type CreateSupplierPaymentRequest = {
  purchaseOrderId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string | null;
};

export type SupplierDebtFilters = {
  outletId?: string | null;
  status?: string;
};

export type SupplierPaymentFilters = {
  outletId?: string | null;
};

export type SupplierPaymentFormValues = {
  amount: string;
  paymentMethod: string;
  referenceNumber: string;
};

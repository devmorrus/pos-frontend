export type BufferStockItem = {
  productId: string;
  productVariantId: string | null;
  sku: string;
  productName: string;
  variantName: string | null;
  categoryId: string;
  categoryName: string;
  unit: string;
  qtyOnHand: number;
  bufferQty: number;
  availableOnlineQty: number;
  isOnlineAvailable: boolean;
  isEnabled: boolean;
  updatedAt: string;
  bufferUpdatedAt: string | null;
};

export type BufferStockFilters = {
  outletId?: string;
  search?: string;
};

export type UpdateBufferStockRequest = {
  outletId: string;
  productId: string;
  productVariantId?: string | null;
  bufferQty: number;
  isEnabled: boolean;
};

export function getBufferStockKey(item: Pick<BufferStockItem, "productId" | "productVariantId">) {
  return `${item.productId}::${item.productVariantId ?? "base"}`;
}

export function calculateAvailableOnline(qtyOnHand: number, bufferQty: number, isEnabled: boolean) {
  if (!isEnabled) {
    return Math.max(0, qtyOnHand);
  }
  const safeBuffer = bufferQty < 0 ? 0 : bufferQty;
  return Math.max(0, qtyOnHand - safeBuffer);
}

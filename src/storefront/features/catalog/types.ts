// Types untuk public catalog — dari GET /api/public/{businessSlug}/catalog/{outletCode}
export interface PublicProduct {
  id: string;
  name: string;
  sku: string;
  basePrice: number;
  unit: string;
  categoryName: string | null;
  categoryId: string | null;
  qtyOnHand: number;
}

// Types untuk kategori — dari GET /api/public/{businessSlug}/categories
export interface PublicCategory {
  id: string;
  name: string;
}

// Computed stock status untuk tampilan UI
export type StockStatus = "available" | "low" | "out_of_stock";

export function getStockStatus(qtyOnHand: number): StockStatus {
  if (qtyOnHand === 0) return "out_of_stock";
  if (qtyOnHand <= 5) return "low";
  return "available";
}

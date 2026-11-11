import { apiClient } from "../../../api/client";

export type ProductBrand = { id: string; name: string; isActive: boolean; modelCount: number; productCount: number };
export type ProductModel = { id: string; brandId: string; brandName: string; name: string; isActive: boolean; productCount: number };
export const getProductBrands = (includeInactive = false) => apiClient.get<ProductBrand[]>(`/api/product-brands?includeInactive=${includeInactive}`);
export const getProductModels = (brandId?: string, includeInactive = false) => apiClient.get<ProductModel[]>(`/api/product-models?${brandId ? `brandId=${brandId}&` : ""}includeInactive=${includeInactive}`);
export const generateProductBarcode = () => apiClient.post<{ barcode: string }>("/api/products/generate-barcode", {});

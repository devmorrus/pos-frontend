import { apiClient } from "../../../api/client";
import type {
  CreateProductRequest,
  ProductDto,
  ProductFilters,
  ProductTrackingOptionsDto,
  UpdateProductRequest,
} from "../types/product";

export function getProducts(filters: ProductFilters = {}) {
  const params = new URLSearchParams();

  if (filters.outletId) {
    params.set("outletId", filters.outletId);
  }

  if (filters.isRawMaterial !== undefined) {
    params.set("isRawMaterial", String(filters.isRawMaterial));
  }

  const query = params.toString();
  return apiClient.get<ProductDto[]>(`/api/products${query ? `?${query}` : ""}`);
}

export function getProductById(id: string) {
  return apiClient.get<ProductDto>(`/api/products/${id}`);
}

export function getProductTrackingOptions(
  id: string,
  stockLocationId: string,
  productVariantId?: string | null,
  search?: string,
  includeUnavailable = false,
) {
  const params = new URLSearchParams({ stockLocationId });
  if (productVariantId) params.set("productVariantId", productVariantId);
  if (search?.trim()) params.set("search", search.trim());
  if (includeUnavailable) params.set("includeUnavailable", "true");
  return apiClient.get<ProductTrackingOptionsDto>(`/api/products/${id}/stock-tracking?${params}`);
}

export function createProduct(payload: CreateProductRequest) {
  return apiClient.post<ProductDto>("/api/products", payload);
}

export function updateProduct(id: string, payload: UpdateProductRequest) {
  return apiClient.put<ProductDto>(`/api/products/${id}`, payload);
}

export function deleteProduct(id: string) {
  return apiClient.delete<void>(`/api/products/${id}`);
}

export function uploadProductImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post<{ url: string }>("/api/products/upload-image", formData);
}

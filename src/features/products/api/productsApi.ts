import { apiClient } from "../../../api/client";
import type {
  CreateProductRequest,
  ProductDto,
  ProductFilters,
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

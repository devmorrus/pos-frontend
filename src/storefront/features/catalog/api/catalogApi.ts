import { storefrontClient } from "../../../api/storefrontClient";
import type { PublicProduct, PublicCategory } from "../types";

/**
 * Ambil katalog produk aktif + stok untuk satu outlet.
 * Endpoint: GET /api/public/{businessSlug}/catalog/{outletCode}
 */
export async function fetchCatalog(businessSlug: string, outletCode: string): Promise<PublicProduct[]> {
  return storefrontClient.get<PublicProduct[]>(
    `/api/public/${encodeURIComponent(businessSlug)}/catalog/${encodeURIComponent(outletCode)}`
  );
}

/**
 * Ambil semua kategori — untuk filter di halaman menu.
 * Endpoint: GET /api/public/{businessSlug}/categories
 */
export async function fetchCategories(businessSlug: string): Promise<PublicCategory[]> {
  return storefrontClient.get<PublicCategory[]>(
    `/api/public/${encodeURIComponent(businessSlug)}/categories`
  );
}

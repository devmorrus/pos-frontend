import { useEffect, useState, useCallback } from "react";
import { fetchCatalog, fetchCategories } from "../api/catalogApi";
import type { PublicProduct, PublicCategory } from "../types";

interface UseCatalogResult {
  products: PublicProduct[];
  categories: PublicCategory[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook untuk mengambil katalog produk dan daftar kategori dari backend.
 * Dipakai di MenuPage dan ProductDetailPage.
 *
 * Fetch dijalankan ulang otomatis ketika outletCode berubah.
 * Fetch catalog dan categories berjalan paralel.
 */
export function useCatalog(businessSlug: string | undefined, outletCode: string | undefined): UseCatalogResult {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!businessSlug || !outletCode) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Jalankan paralel untuk efisiensi
      const [productsData, categoriesData] = await Promise.all([
        fetchCatalog(businessSlug, outletCode),
        fetchCategories(businessSlug),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(
        apiError?.message ??
          "Gagal memuat katalog. Silakan periksa koneksi Anda dan coba lagi."
      );
    } finally {
      setIsLoading(false);
    }
  }, [businessSlug, outletCode]);

  useEffect(() => {
    load();
  }, [load]);

  return { products, categories, isLoading, error, refetch: load };
}

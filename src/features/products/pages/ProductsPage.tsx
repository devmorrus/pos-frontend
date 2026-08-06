import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import {
  AppLoader,
  ConfirmDialog,
  InlineAlert,
  PagePlaceholder,
} from "../../../components/ui";
import { useAuth } from "../../auth/hooks/useAuth";
import { isOwner } from "../../auth/utils/access";
import { getErrorMessage } from "../../../utils/errors";
import { getCategories } from "../../categories/api/categoriesApi";
import type { CategoryDto } from "../../categories/types/category";
import { getOutlets } from "../../outlets/api/outletsApi";
import type { OutletLookupDto } from "../../outlets/types/outlet";
import { deleteProduct, getProducts } from "../api/productsApi";
import type { ProductDto } from "../types/product";
import {
  formatRupiah,
  formatStockQuantity,
  getConsignmentLabel,
  getConsignmentTone,
  getStockBadgeClasses,
} from "../utils/presentation";
import { API_BASE_URL } from "../../../api/client/config";

type ProductsLocationState = {
  successMessage?: string;
};

export default function ProductsPage() {
  const location = useLocation();
  const { session } = useAuth();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [outlets, setOutlets] = useState<OutletLookupDto[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<string>(session?.outletId ?? "");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as ProductsLocationState | null)?.successMessage ?? null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ProductDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const ownerMode = isOwner(session?.role);
  const canChangeOutlet = ownerMode;
  const selectableOutlets = useMemo(
    () =>
      outlets.filter((outlet) => {
        if (outlet.isActive) {
          return true;
        }

        return !canChangeOutlet && outlet.id === session?.outletId;
      }),
    [canChangeOutlet, outlets, session?.outletId],
  );

  const categoryNameById = useMemo(
    () =>
      new Map(
        categories.map((category) => [
          category.id,
          category.parentName ? `${category.parentName} / ${category.name}` : category.name,
        ]),
      ),
    [categories],
  );

  async function loadLookups() {
    const [categoriesResult, outletsResult] = await Promise.all([
      getCategories(),
      ownerMode || session?.role === "Admin" ? getOutlets() : Promise.resolve([]),
    ]);

    setCategories(categoriesResult);
    setOutlets(outletsResult);
  }

  async function loadProducts(currentOutletId: string) {
    if (ownerMode && !currentOutletId) {
      setProducts([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const outletId = currentOutletId || session?.outletId || undefined;
    const result = await getProducts(outletId ? { outletId } : {});
    setProducts(result);
  }

  useEffect(() => {
    async function loadPage() {
      setIsLoading(true);
      setError(null);

      try {
        await loadLookups();
        await loadProducts(selectedOutletId);
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat daftar produk."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadPage();
  }, [ownerMode, selectedOutletId, session?.outletId, session?.role]);

  async function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteProduct(deleteTarget.id);
      setSuccessMessage(
        `Produk ${deleteTarget.name} berhasil dihapus atau dinonaktifkan sesuai aturan backend.`,
      );
      setDeleteTarget(null);
      await loadProducts(selectedOutletId);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal menghapus produk."));
    } finally {
      setIsDeleting(false);
    }
  }

  const shouldShowOutletPrompt = ownerMode && !selectedOutletId;

  return (
    <ProtectedPageShell
      title="Produk"
      description="Kelola master produk MorrusPOS lengkap dengan kategori, harga, tipe konsinyasi, dan stok per outlet."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      <AppTableShell
        title="Daftar produk"
        description="Listing produk fase 2 mengambil stok langsung dari backend berdasarkan outlet yang aktif."
        actions={
          <>
            {(ownerMode || session?.role === "Admin") && selectableOutlets.length > 0 ? (
              <select
                value={selectedOutletId}
                disabled={!canChangeOutlet && Boolean(session?.outletId)}
                onChange={(event) => setSelectedOutletId(event.target.value)}
                className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:disabled:bg-gray-900"
              >
                <option value="">
                  {ownerMode ? "Pilih outlet" : "Outlet aktif pengguna"}
                </option>
                {selectableOutlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                    {!outlet.isActive ? " (nonaktif)" : ""}
                  </option>
                ))}
              </select>
            ) : null}
            <Link
              to="/products/create"
              className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Tambah produk
            </Link>
          </>
        }
      >
        {isLoading ? (
          <AppLoader label="Memuat daftar produk..." />
        ) : shouldShowOutletPrompt ? (
          <div className="p-6">
            <PagePlaceholder
              title="Pilih outlet terlebih dahulu"
              description="Owner perlu memilih outlet agar listing produk dan stok saat ini dapat dimuat dengan konteks yang benar."
              status="Outlet required"
            />
          </div>
        ) : products.length === 0 ? (
          <div className="p-6">
            <PagePlaceholder
              title="Belum ada produk"
              description="Tambahkan produk pertama untuk outlet yang sedang dipilih agar modul kasir dan stok siap dilanjutkan."
              status="Empty"
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                {[
                  "Foto",
                  "SKU",
                  "Nama",
                  "Kategori",
                  "Barcode",
                  "Harga Jual",
                  "Unit",
                  "Tipe",
                  "Stok Saat Ini",
                  "Aksi",
                ].map((column) => (
                  <th
                    key={column}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {products.map((product) => (
                <tr key={product.id} className="align-top">
                  <td className="px-6 py-4">
                    {product.imageUrl ? (
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                        <img
                          src={`${API_BASE_URL}${product.imageUrl}`}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-xs font-semibold text-gray-500">
                        {product.name.substring(0, 1).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {categoryNameById.get(product.categoryId) ?? "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {product.barcode ?? "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                    {formatRupiah(product.basePrice)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {product.unit}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getConsignmentTone(product.isConsignment)}`}
                    >
                      {getConsignmentLabel(product.isConsignment)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStockBadgeClasses(product.qtyOnHand)}`}
                    >
                      {formatStockQuantity(product.qtyOnHand)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/products/${product.id}/edit`}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(product)}
                        className="rounded-xl border border-error-200 px-3 py-2 text-xs font-semibold text-error-700 dark:border-error-500/20 dark:text-error-300"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AppTableShell>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus produk"
        description={`Anda yakin ingin menghapus produk ${deleteTarget?.name ?? ""}? Backend dapat melakukan hard delete atau menonaktifkan produk jika sudah punya riwayat transaksi.`}
        confirmLabel="Hapus produk"
        isBusy={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </ProtectedPageShell>
  );
}

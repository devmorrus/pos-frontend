import { useEffect, useState } from "react";
import { Link } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { getStockOpnames } from "../api/inventoryApi";
import { useStockOutletScope } from "../hooks/useStockOutletScope";
import type { StockOpnameDto } from "../types/inventory";
import { formatDateTime, formatQuantity } from "../utils/presentation";

export default function StockOpnamesPage() {
  const { ownerMode, effectiveOutletId } =
    useStockOutletScope();
  const [items, setItems] = useState<StockOpnameDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOpnames() {
      if (!effectiveOutletId) {
        setItems([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        setItems(await getStockOpnames(effectiveOutletId));
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat histori stock opname."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadOpnames();
  }, [effectiveOutletId]);

  return (
    <ProtectedPageShell
      title="Stock Opname"
      description="Lihat histori penyesuaian stok fisik per outlet dan masuk ke alur pembuatan opname baru."
    >
      <InlineAlert tone="error" message={error} />
      <AppTableShell
        title="Histori stock opname"
        description="Daftar stock opname yang pernah dilakukan."
        actions={
          <Link
            to="/stock-opnames/create"
            className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Buat stock opname
          </Link>
        }
      >
        {isLoading ? (
          <AppLoader label="Memuat histori stock opname..." />
        ) : ownerMode && !effectiveOutletId ? (
          <div className="p-6">
            <PagePlaceholder
              title="Pilih outlet terlebih dahulu"
              description="Owner perlu memilih outlet agar histori stock opname bisa dimuat."
              status="Outlet required"
            />
          </div>
        ) : items.length === 0 ? (
          <div className="p-6">
            <PagePlaceholder
              title="Belum ada stock opname"
              description="Belum ada aktivitas opname untuk outlet aktif."
              status="Empty"
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                {["Waktu", "Outlet", "Performed by", "Status", "Jumlah item", "Total variance", "Aksi"].map((column) => (
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
              {items.map((item) => {
                const totalVariance = item.items.reduce((sum, row) => sum + row.variance, 0);
                return (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{formatDateTime(item.createdAt)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.outletName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.performedByName}</td>
                    <td className="px-6 py-4 text-sm text-success-700 dark:text-success-300">{item.status}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.items.length}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{formatQuantity(totalVariance)}</td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/stock-opnames/${item.id}`}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </AppTableShell>
    </ProtectedPageShell>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { getConsignmentLabel, getConsignmentTone } from "../../products/utils/presentation";
import { useRealtime } from "../../../lib/realtime/hooks";
import { getInventory } from "../api/inventoryApi";
import StockOutletSelector from "../components/StockOutletSelector";
import StockStatusBadge from "../components/StockStatusBadge";
import { useStockOutletScope } from "../hooks/useStockOutletScope";
import type { InventoryListItem } from "../types/inventory";
import { formatDateTime, formatQuantity } from "../utils/presentation";

export default function InventoryPage() {
  const { ownerMode, activeOutlets, effectiveOutletId, selectedOutletId, setSelectedOutletId } =
    useStockOutletScope();
  const { onStockUpdate } = useRealtime();
  const [items, setItems] = useState<InventoryListItem[]>([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [stockMode, setStockMode] = useState<"all" | "low">("all");
  const [includeZeroStock, setIncludeZeroStock] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadInventory() {
    if (!effectiveOutletId) {
      setItems([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getInventory({
        outletId: effectiveOutletId,
        search: appliedSearch,
        lowStockOnly: stockMode === "low",
        includeZeroStock,
      });
      setItems(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat inventory outlet."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadInventory();
  }, [effectiveOutletId, appliedSearch, stockMode, includeZeroStock]);

  useEffect(() => {
    const unsubscribe = onStockUpdate((event) => {
      if (event.outletId === effectiveOutletId) {
        void loadInventory();
      }
    });

    return unsubscribe;
  }, [effectiveOutletId, onStockUpdate]);

  const lowStockCount = useMemo(
    () => items.filter((item) => item.isLowStock || item.qtyOnHand <= item.minStockAlert).length,
    [items],
  );

  const shouldShowOutletPrompt = ownerMode && !effectiveOutletId;

  return (
    <ProtectedPageShell
      title="Stok"
      description="Pantau stok outlet aktif, deteksi stok rendah, dan masuk ke alur stock opname atau transfer dari satu halaman inventory."
    >
      <InlineAlert tone="error" message={error} />

      <AppTableShell
        title="Inventory outlet"
        description={`Total item: ${items.length} · Stok rendah: ${lowStockCount}`}
        actions={
          <>
            <StockOutletSelector
              ownerMode={ownerMode}
              value={selectedOutletId}
              onChange={setSelectedOutletId}
              outlets={activeOutlets}
            />
            <Link
              to="/stock-opnames/create"
              className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Buat stock opname
            </Link>
            <Link
              to="/stock-transfers/outgoing"
              className="inline-flex items-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
            >
              Transfer stok keluar
            </Link>
          </>
        }
      >
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="grid gap-3 lg:grid-cols-[2fr_1fr_auto_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setAppliedSearch(search);
                }
              }}
              placeholder="Cari produk berdasarkan nama, SKU, atau barcode"
              className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            />
            <select
              value={stockMode}
              onChange={(event) => setStockMode(event.target.value as "all" | "low")}
              className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            >
              <option value="all">Semua stok</option>
              <option value="low">Stok rendah saja</option>
            </select>
            <label className="flex h-11 items-center gap-3 rounded-2xl border border-gray-200 px-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
              <input
                type="checkbox"
                checked={includeZeroStock}
                onChange={(event) => setIncludeZeroStock(event.target.checked)}
              />
              Tampilkan stok 0
            </label>
            <button
              type="button"
              onClick={() => setAppliedSearch(search)}
              className="h-11 rounded-2xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
            >
              Terapkan
            </button>
          </div>
        </div>

        {isLoading ? (
          <AppLoader label="Memuat inventory..." />
        ) : shouldShowOutletPrompt ? (
          <div className="p-6">
            <PagePlaceholder
              title="Pilih outlet terlebih dahulu"
              description="Owner perlu menentukan outlet operasional agar inventory, opname, dan transfer stok memakai konteks yang benar."
              status="Outlet required"
            />
          </div>
        ) : items.length === 0 ? (
          <div className="p-6">
            <PagePlaceholder
              title="Belum ada data stok"
              description="Belum ada item inventory yang cocok dengan filter saat ini pada outlet aktif."
              status="Empty"
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                {["SKU", "Nama Produk", "Kategori", "Unit", "Tipe", "Qty On Hand", "Min Alert", "Status", "Updated", "Aksi"].map((column) => (
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
              {items.map((item) => (
                <tr key={item.productId} className="align-top">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.sku}</td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.barcode ?? "Tanpa barcode"}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.categoryName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.unit}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getConsignmentTone(item.isConsignment)}`}>
                      {getConsignmentLabel(item.isConsignment)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{formatQuantity(item.qtyOnHand)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{formatQuantity(item.minStockAlert)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 items-start">
                      <StockStatusBadge
                        qtyOnHand={item.qtyOnHand}
                        minStockAlert={item.minStockAlert}
                        isLowStock={item.isLowStock}
                      />
                      {item.costPrice > item.basePrice && (
                        <span className="inline-flex rounded-full bg-error-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-error-700 dark:bg-error-500/10 dark:text-error-300">
                          Margin Negatif
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{formatDateTime(item.updatedAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to="/stock-opnames/create"
                        className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                      >
                        Opname
                      </Link>
                      <Link
                        to="/stock-transfers/outgoing"
                        className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                      >
                        Transfer
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AppTableShell>
    </ProtectedPageShell>
  );
}

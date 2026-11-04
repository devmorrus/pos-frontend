import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { getConsignmentLabel, getConsignmentTone } from "../../products/utils/presentation";
import { useRealtime } from "../../../lib/realtime/hooks";
import { getInventory } from "../api/inventoryApi";
import { getProductTrackingOptions } from "../../products/api/productsApi";
import type { ProductTrackingOptionsDto } from "../../products/types/product";
import StockStatusBadge from "../components/StockStatusBadge";
import { useStockOutletScope } from "../hooks/useStockOutletScope";
import type { InventoryListItem } from "../types/inventory";
import { formatDateTime, formatQuantity } from "../utils/presentation";

export default function InventoryPage() {
  const { ownerMode, effectiveOutletId } =
    useStockOutletScope();
  const { onStockUpdate } = useRealtime();
  const [items, setItems] = useState<InventoryListItem[]>([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [stockMode, setStockMode] = useState<"all" | "low">("all");
  const [includeZeroStock, setIncludeZeroStock] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingDetail, setTrackingDetail] = useState<{ item: InventoryListItem; options: ProductTrackingOptionsDto } | null>(null);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);

  async function openTrackingDetail(item: InventoryListItem) {
    if (!effectiveOutletId) return;
    setIsLoadingTracking(true);
    setError(null);
    try {
      const options = await getProductTrackingOptions(
        item.productId,
        effectiveOutletId,
        item.productVariantId,
        undefined,
        true,
      );
      setTrackingDetail({ item, options });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat detail batch/serial."));
    } finally {
      setIsLoadingTracking(false);
    }
  }

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
            <Link
              to="/buffer-stock"
              className="inline-flex items-center rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-300"
            >
              Atur buffer stock
            </Link>
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
                {["SKU", "Nama Produk", "Kategori", "Unit", "Tipe", "Tracking", "Qty On Hand", "Min Alert", "Status", "Updated", "Aksi"].map((column) => (
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
                <tr
                  key={`${item.productId}::${item.productVariantId ?? "base"}`}
                  className="align-top"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.sku}</td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</span>
                        {item.costPrice > item.basePrice && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-error-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-error-700 dark:bg-error-500/10 dark:text-error-300">
                            ⚠️ Margin Negatif
                          </span>
                        )}
                      </div>
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
                  <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300">
                    <span className="rounded-full bg-gray-100 px-2 py-1 font-semibold uppercase dark:bg-gray-800">
                      {item.trackingMode}
                    </span>
                    {(item.trackingMode === "batch" || item.trackingMode === "serial") && (
                      <span className="ml-2">{item.trackedItemCount} {item.trackingMode === "batch" ? "batch" : "serial"}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{formatQuantity(item.qtyOnHand)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{formatQuantity(item.minStockAlert)}</td>
                  <td className="px-6 py-4">
                    <StockStatusBadge
                      qtyOnHand={item.qtyOnHand}
                      minStockAlert={item.minStockAlert}
                      isLowStock={item.isLowStock}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{formatDateTime(item.updatedAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to="/buffer-stock"
                        className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-300"
                      >
                        Buffer
                      </Link>
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
                      {(item.trackingMode === "batch" || item.trackingMode === "serial") && (
                        <button
                          type="button"
                          disabled={isLoadingTracking}
                          onClick={() => void openTrackingDetail(item)}
                          className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 disabled:opacity-50 dark:border-brand-800 dark:text-brand-300"
                        >
                          Detail tracking
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AppTableShell>

      {trackingDetail && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Detail tracking</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{trackingDetail.item.productName} · {trackingDetail.item.sku}</p>
              </div>
              <button type="button" onClick={() => setTrackingDetail(null)} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900">✕</button>
            </div>
            <div className="mt-5 space-y-2">
              {trackingDetail.item.trackingMode === "batch" ? (
                trackingDetail.options.batches.length === 0 ? <p className="text-sm text-gray-500">Belum ada batch.</p> :
                  trackingDetail.options.batches.map((batch) => {
                    const expired = batch.expiryDate !== null && new Date(batch.expiryDate).getTime() < new Date().setHours(0, 0, 0, 0);
                    return (
                      <div key={batch.id} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 p-3 dark:border-gray-800">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{batch.batchNumber}</p>
                          <p className={`text-xs ${expired ? "text-error-600" : "text-gray-500"}`}>
                            {batch.expiryDate ? `Exp ${new Date(batch.expiryDate).toLocaleDateString("id-ID")}` : "Tanpa kedaluwarsa"}{expired ? " · kedaluwarsa" : ""}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{formatQuantity(batch.qtyRemaining)}</span>
                      </div>
                    );
                  })
              ) : trackingDetail.options.serials.length === 0 ? (
                <p className="text-sm text-gray-500">Tidak ada serial tersedia.</p>
              ) : trackingDetail.options.serials.map((serial) => (
                <div key={serial.id} className="rounded-2xl border border-gray-200 p-3 font-mono text-sm text-gray-900 dark:border-gray-800 dark:text-white">
                  {serial.serialNumber}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </ProtectedPageShell>
  );
}

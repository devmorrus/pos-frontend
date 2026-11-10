import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, InlineAlert } from "../../../components/ui";
import { CheckLineIcon, ChevronLeftIcon, TaskIcon } from "../../../icons";
import { useRealtime } from "../../../lib/realtime/hooks";
import { getErrorMessage } from "../../../utils/errors";
import { createStockOpname, getInventory } from "../api/inventoryApi";
import OpnameItemsEditor, { type OpnameDraftItem } from "../components/OpnameItemsEditor";
import type { InventoryListItem } from "../types/inventory";
import { useStockOutletScope } from "../hooks/useStockOutletScope";

function createOpnameDraftItem(): OpnameDraftItem {
  return {
    id: crypto.randomUUID(),
    productId: "",
    productVariantId: null,
    productBatchId: "",
    productSerialIds: [],
    serials: [],
    physicalQty: "",
  };
}

export default function StockOpnameCreatePage() {
  const navigate = useNavigate();
  const { effectiveOutletId, ownerMode } = useStockOutletScope();
  const { onStockUpdate } = useRealtime();
  const [inventoryItems, setInventoryItems] = useState<InventoryListItem[]>([]);
  const [items, setItems] = useState<OpnameDraftItem[]>([createOpnameDraftItem()]);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadInventoryLookup() {
    if (!effectiveOutletId) {
      setInventoryItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      setInventoryItems(
        await getInventory({
          stockLocationId: effectiveOutletId,
          includeZeroStock: true,
        }),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat lookup inventory untuk opname."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadInventoryLookup();
  }, [effectiveOutletId]);

  useEffect(() => {
    const unsubscribe = onStockUpdate((event) => {
      if ((event.stockLocationId ?? event.outletId) === effectiveOutletId) {
        setWarning("Stok sistem baru saja berubah oleh transaksi lain. Periksa kembali angka system qty sebelum submit opname.");
        void loadInventoryLookup();
      }
    });

    return unsubscribe;
  }, [effectiveOutletId, onStockUpdate]);

  function updateItem(index: number, patch: Partial<OpnameDraftItem>) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    );
  }

  function addItem() {
    setItems((current) => [...current, createOpnameDraftItem()]);
  }

  function removeItem(index: number) {
    setItems((current) => (current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setWarning(null);

    if (!effectiveOutletId) {
      setError("Pilih outlet aktif terlebih dahulu.");
      return;
    }

    const hasEmptyProduct = items.some((item) => !item.productId);
    if (hasEmptyProduct) {
      setError("Setiap baris item wajib memiliki produk yang dipilih.");
      return;
    }

    const hasInvalidQty = items.some(
      (item) => item.physicalQty === "" || !Number.isFinite(Number(item.physicalQty)) || Number(item.physicalQty) < 0
    );
    if (hasInvalidQty) {
      setError("Physical Qty harus berupa angka 0 atau lebih untuk semua item.");
      return;
    }
    if (items.some((item) => item.trackingMode === "batch" && !item.productBatchId)) {
      setError("Batch wajib dipilih untuk setiap produk batch.");
      return;
    }

    const normalizedItems = items.map((item) => ({
      productId: item.productId,
      productVariantId: item.productVariantId,
      productBatchId: item.productBatchId || null,
      productSerialIds: item.trackingMode === "serial" ? item.productSerialIds : null,
      physicalQty: Number(item.physicalQty),
    }));

    if (normalizedItems.length === 0) {
      setError("Isi minimal satu item opname yang valid.");
      return;
    }

    const uniqueIds = new Set(normalizedItems.map((item) => `${item.productId}:${item.productVariantId ?? ""}:${item.productBatchId ?? ""}`));
    if (uniqueIds.size !== normalizedItems.length) {
      setError("Produk dan batch opname tidak boleh duplikat.");
      return;
    }

    if (items.some((item) => item.trackingMode === "serial") &&
        !window.confirm("Serial tersedia yang tidak dipilih akan ditandai written off. Lanjutkan stock opname?")) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createStockOpname({
        stockLocationId: effectiveOutletId,
        items: normalizedItems,
      });
      navigate(`/stock-opnames/${result.id}`, {
        state: { successMessage: "Stock opname berhasil dibuat." },
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal membuat stock opname."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Buat Stock Opname"
      description="Catat jumlah fisik riil barang pada outlet aktif untuk merekonsiliasi selisih stok sistem."
    >
      <InlineAlert tone="error" message={error} />

      {ownerMode && !effectiveOutletId ? (
        <div className="flex flex-col items-center rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="relative">
            <div className="absolute inset-0 scale-125 rounded-full bg-brand-500/10 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/25">
              <TaskIcon className="h-7 w-7" />
            </div>
          </div>
          <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">
            Pilih outlet aktif terlebih dahulu
          </h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            Kembali ke inventory atau histori opname untuk memilih outlet kerja sebelum membuat
            stock opname.
          </p>
          <Link
            to="/inventory"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Kembali ke inventory
          </Link>
        </div>
      ) : isLoading ? (
        <AppLoader label="Memuat data inventory..." />
      ) : (
        <form onSubmit={handleSubmit}>
          <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-br from-brand-50 via-white to-white p-6 dark:border-gray-800 dark:from-brand-500/10 dark:via-gray-900 dark:to-gray-900 sm:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/15 blur-2xl"
              />
              <div className="relative flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 scale-125 rounded-3xl bg-brand-500/20 blur-lg" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/25">
                    <TaskIcon className="h-6 w-6" />
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Form stock opname
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Setiap item akan membandingkan stok sistem dengan stok fisik, lalu backend
                    menghitung selisih dan ledger penyesuaiannya.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <OpnameItemsEditor
                outletId={effectiveOutletId!}
                inventoryItems={inventoryItems}
                items={items}
                onChange={updateItem}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                warning={warning}
              />

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {items.length} baris item siap direkonsiliasi.
                </p>
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate("/stock-opnames")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-500/10 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <CheckLineIcon className="h-4 w-4" />
                    {isSubmitting ? "Menyimpan..." : "Simpan stock opname"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </form>
      )}
    </ProtectedPageShell>
  );
}

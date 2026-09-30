import { useEffect, useMemo, useState } from "react";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { useRealtime } from "../../../lib/realtime/hooks";
import { getBufferStocks, updateBufferStock } from "../api/bufferStockApi";
import { useStockOutletScope } from "../hooks/useStockOutletScope";
import type { BufferStockItem } from "../types/bufferStock";
import { calculateAvailableOnline, getBufferStockKey } from "../types/bufferStock";
import { formatDateTime, formatQuantity } from "../utils/presentation";

type StatusFilter = "all" | "available" | "unavailable";

export default function BufferStockPage() {
  const {
    ownerMode,
    activeOutlets,
    selectedOutletId,
    setSelectedOutletId,
    effectiveOutletId,
  } = useStockOutletScope();
  const { onStockUpdate } = useRealtime();

  const [items, setItems] = useState<BufferStockItem[]>([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [onlyBuffered, setOnlyBuffered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editing, setEditing] = useState<BufferStockItem | null>(null);
  const [bufferInput, setBufferInput] = useState("0");
  const [isEnabledInput, setIsEnabledInput] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  async function loadBufferStocks() {
    if (!effectiveOutletId) {
      setItems([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getBufferStocks({
        outletId: effectiveOutletId,
        search: appliedSearch,
      });
      setItems(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat buffer stock."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadBufferStocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveOutletId, appliedSearch]);

  useEffect(() => {
    const unsubscribe = onStockUpdate((event) => {
      if (event.outletId === effectiveOutletId) {
        void loadBufferStocks();
      }
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveOutletId, onStockUpdate]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter === "available" && !item.isOnlineAvailable) return false;
      if (statusFilter === "unavailable" && item.isOnlineAvailable) return false;
      if (onlyBuffered && !(item.bufferQty > 0)) return false;
      return true;
    });
  }, [items, statusFilter, onlyBuffered]);

  const summary = useMemo(() => {
    const total = items.length;
    const unavailable = items.filter((i) => !i.isOnlineAvailable).length;
    const totalBuffer = items.reduce((sum, i) => sum + (i.isEnabled ? i.bufferQty : 0), 0);
    return { total, unavailable, totalBuffer };
  }, [items]);

  const shouldShowOutletPrompt = ownerMode && !effectiveOutletId;

  function openEditModal(item: BufferStockItem) {
    setEditing(item);
    setBufferInput(String(item.bufferQty ?? 0));
    setIsEnabledInput(item.isEnabled);
    setModalError(null);
    setSuccess(null);
  }

  function closeEditModal() {
    if (isSaving) return;
    setEditing(null);
    setModalError(null);
  }

  const previewAvailable = useMemo(() => {
    if (!editing) return 0;
    const parsed = Number(bufferInput || 0);
    if (Number.isNaN(parsed)) return editing.availableOnlineQty;
    return calculateAvailableOnline(editing.qtyOnHand, parsed, isEnabledInput);
  }, [editing, bufferInput, isEnabledInput]);

  const bufferExceedsStock =
    editing != null && Number(bufferInput || 0) > editing.qtyOnHand && isEnabledInput;

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!editing || !effectiveOutletId) return;

    const parsed = Number(bufferInput);
    if (Number.isNaN(parsed) || parsed < 0) {
      setModalError("Buffer stock harus berupa angka 0 atau lebih.");
      return;
    }

    if (Math.round(parsed * 100) !== parsed * 100) {
      setModalError("Buffer stock maksimal 2 angka desimal.");
      return;
    }

    setIsSaving(true);
    setModalError(null);

    try {
      const updated = await updateBufferStock(editing.productId, {
        outletId: effectiveOutletId,
        productId: editing.productId,
        productVariantId: editing.productVariantId,
        bufferQty: parsed,
        isEnabled: isEnabledInput,
      });

      setItems((prev) =>
        prev.map((row) => (getBufferStockKey(row) === getBufferStockKey(updated) ? updated : row)),
      );
      setSuccess(
        `Buffer ${updated.productName}${updated.variantName ? ` (${updated.variantName})` : ""} disimpan. Stok online: ${updated.availableOnlineQty}.`,
      );
      setEditing(null);
    } catch (requestError) {
      setModalError(getErrorMessage(requestError, "Gagal menyimpan buffer stock."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Buffer Stock"
      description="Atur stok pengaman per outlet, produk, dan varian agar tidak dipublikasikan ke platform online seperti GoFood dan GrabFood. Rumus: stok online = max(0, stok fisik - buffer)."
    >
      <InlineAlert tone="error" message={error} />
      <InlineAlert tone="success" message={success} />

      <AppTableShell
        title="Buffer stock outlet"
        description={`Total item: ${summary.total} · Tidak tersedia online: ${summary.unavailable} · Total buffer aktif: ${formatQuantity(summary.totalBuffer)}`}
        actions={
          ownerMode ? (
            <select
              value={selectedOutletId ?? ""}
              onChange={(event) => setSelectedOutletId(event.target.value || null)}
              className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            >
              <option value="">Pilih outlet</option>
              {activeOutlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
          ) : undefined
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
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            >
              <option value="all">Semua status online</option>
              <option value="available">Tersedia online</option>
              <option value="unavailable">Tidak tersedia online</option>
            </select>
            <label className="flex h-11 items-center gap-3 rounded-2xl border border-gray-200 px-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
              <input
                type="checkbox"
                checked={onlyBuffered}
                onChange={(event) => setOnlyBuffered(event.target.checked)}
              />
              Hanya ada buffer
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
          <AppLoader label="Memuat buffer stock..." />
        ) : shouldShowOutletPrompt ? (
          <div className="p-6">
            <PagePlaceholder
              title="Pilih outlet terlebih dahulu"
              description="Owner perlu menentukan outlet operasional agar buffer stock memakai konteks yang benar."
              status="Outlet required"
            />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-6">
            <PagePlaceholder
              title="Belum ada data buffer stock"
              description="Belum ada item yang cocok dengan filter saat ini pada outlet aktif."
              status="Empty"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-950">
                <tr>
                  {[
                    "SKU",
                    "Produk",
                    "Varian",
                    "Stok Fisik",
                    "Buffer",
                    "Tersedia Online",
                    "Status Online",
                    "Update Buffer",
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
                {filteredItems.map((item) => (
                  <tr key={getBufferStockKey(item)} className="align-top">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {item.sku}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.productName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.categoryName} · {item.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {item.variantName ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {formatQuantity(item.qtyOnHand)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {item.isEnabled ? formatQuantity(item.bufferQty) : "Nonaktif"}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {formatQuantity(item.availableOnlineQty)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.isOnlineAvailable
                            ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300"
                            : "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-300"
                        }`}
                      >
                        {item.isOnlineAvailable ? "Tersedia" : "Tidak tersedia"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {item.bufferUpdatedAt ? formatDateTime(item.bufferUpdatedAt) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                      >
                        Atur buffer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AppTableShell>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Atur buffer stock</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {editing.productName}
              {editing.variantName ? ` · ${editing.variantName}` : ""} · SKU {editing.sku}
            </p>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3 rounded-2xl bg-gray-50 p-4 text-sm dark:bg-gray-950">
                <div>
                  <div className="text-xs text-gray-500">Stok fisik</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatQuantity(editing.qtyOnHand)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Buffer baru</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatQuantity(Number(bufferInput || 0))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Tersedia online</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatQuantity(previewAvailable)}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Buffer stock
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={bufferInput}
                  onChange={(event) => setBufferInput(event.target.value)}
                  className="mt-1 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Stok online = max(0, stok fisik - buffer). Mengubah buffer tidak mengubah stok
                  fisik dan tidak mencatat mutasi stok.
                </p>
              </div>

              <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={isEnabledInput}
                  onChange={(event) => setIsEnabledInput(event.target.checked)}
                />
                Buffer aktif (jika nonaktif, buffer dianggap 0)
              </label>

              {bufferExceedsStock ? (
                <div className="rounded-2xl bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:bg-warning-500/10 dark:text-warning-300">
                  Buffer lebih besar dari stok fisik. Produk tidak akan tersedia di platform online.
                </div>
              ) : null}

              {modalError ? <InlineAlert tone="error" message={modalError} /> : null}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={isSaving}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-60 dark:border-gray-800 dark:text-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSaving ? "Menyimpan..." : "Simpan buffer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </ProtectedPageShell>
  );
}

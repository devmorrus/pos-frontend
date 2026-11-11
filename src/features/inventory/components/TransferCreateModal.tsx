import { useEffect, useMemo, useState } from "react";
import { InlineAlert } from "../../../components/ui";
import { Modal } from "../../../components/ui/modal";
import {
  BoxIcon,
  ChevronDownIcon,
  PaperPlaneIcon,
  PlusIcon,
  TrashBinIcon,
} from "../../../icons";
import type { StockLocationDto } from "../../stock-locations/types";
import { getProductTrackingOptions } from "../../products/api/productsApi";
import type { ProductTrackingOptionsDto } from "../../products/types/product";
import type { CreateStockTransferRequest, InventoryListItem } from "../types/inventory";
import { formatQuantity } from "../utils/presentation";

type TransferDraftItem = {
  id: string;
  productId: string;
  productVariantId?: string | null;
  productBatchId?: string;
  productSerialIds: string[];
  qty: string;
};

function createDraftItem(): TransferDraftItem {
  return { id: crypto.randomUUID(), productId: "", productVariantId: null, productBatchId: "", productSerialIds: [], qty: "" };
}

function inventoryKey(item: Pick<InventoryListItem, "productId" | "productVariantId">) {
  return `${item.productId}::${item.productVariantId ?? "base"}`;
}

export default function TransferCreateModal({
  open,
  fromOutletId,
  outlets,
  inventoryItems,
  isSubmitting,
  submitError,
  onClose,
  onSubmit,
}: {
  open: boolean;
  fromOutletId: string | null;
  outlets: StockLocationDto[];
  inventoryItems: InventoryListItem[];
  isSubmitting: boolean;
  submitError?: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateStockTransferRequest) => Promise<void>;
}) {
  const [toOutletId, setToOutletId] = useState("");
  const [items, setItems] = useState<TransferDraftItem[]>([createDraftItem()]);
  const [trackingOptions, setTrackingOptions] = useState<Record<string, ProductTrackingOptionsDto>>({});
  const [serialSearch, setSerialSearch] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (!open) {
      setToOutletId("");
      setItems([createDraftItem()]);
      setTrackingOptions({});
      setSerialSearch({});
      setValidationError(null);
      setRequestId(crypto.randomUUID());
    }
  }, [open]);

  const selectableOutlets = useMemo(
    () => outlets.filter((outlet) => outlet.id !== fromOutletId && outlet.isActive),
    [fromOutletId, outlets],
  );

  if (!open) {
    return null;
  }

  function updateItem(index: number, key: keyof TransferDraftItem, value: string) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    );
  }

  async function selectInventory(index: number, value: string) {
    const selected = inventoryItems.find((entry) => inventoryKey(entry) === value);
    const row = items[index];
    if (!row) return;
    setItems((current) => current.map((item, itemIndex) => itemIndex === index
      ? {
          ...item,
          productId: selected?.productId ?? "",
          productVariantId: selected?.productVariantId ?? null,
          productBatchId: "",
          productSerialIds: [],
          qty: "",
        }
      : item));
    if (!selected || selected.trackingMode === "quantity") return;
    await loadTracking(row, selected);
  }

  async function loadTracking(row: TransferDraftItem, selected: InventoryListItem, search = "") {
    if (!fromOutletId) return;
    try {
      const options = await getProductTrackingOptions(selected.productId, fromOutletId, selected.productVariantId, search);
      setTrackingOptions((current) => ({
        ...current,
        [row.id]: search && options.trackingMode === "serial"
          ? {
              ...options,
              serials: [...(current[row.id]?.serials ?? []), ...options.serials]
                .filter((serial, position, all) => all.findIndex((item) => item.id === serial.id) === position),
            }
          : options,
      }));
    } catch {
      setValidationError(`Gagal memuat ${selected.trackingMode} untuk ${selected.productName}.`);
    }
  }

  function addItem() {
    setItems((current) => [...current, createDraftItem()]);
  }

  function removeItem(index: number) {
    setItems((current) => (current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    if (!fromOutletId) {
      setValidationError("Lokasi asal belum tersedia.");
      return;
    }

    if (!toOutletId) {
      setValidationError("Pilih lokasi tujuan terlebih dahulu.");
      return;
    }

    const hasEmptyProduct = items.some((item) => !item.productId);
    if (hasEmptyProduct) {
      setValidationError("Setiap baris item wajib memiliki produk yang dipilih.");
      return;
    }

    const hasInvalidQty = items.some(
      (item) => !item.qty || !Number.isFinite(Number(item.qty)) || Number(item.qty) <= 0
    );
    if (hasInvalidQty) {
      setValidationError("Qty transfer harus berupa angka lebih besar dari 0 untuk semua item.");
      return;
    }

    if (items.some((item) => {
      const inv = inventoryItems.find((entry) => entry.productId === item.productId && entry.productVariantId === item.productVariantId);
      return inv?.trackingMode === "batch" && !item.productBatchId;
    })) {
      setValidationError("Pilih batch untuk setiap produk batch.");
      return;
    }
    if (items.some((item) => {
      if (!item.productBatchId) return false;
      const batch = trackingOptions[item.id]?.batches.find((entry) => entry.id === item.productBatchId);
      return !batch || Number(item.qty) > batch.qtyRemaining;
    })) {
      setValidationError("Qty transfer melebihi stok batch yang dipilih.");
      return;
    }
    if (items.some((item) => {
      const inv = inventoryItems.find((entry) => entry.productId === item.productId && entry.productVariantId === item.productVariantId);
      return inv?.trackingMode === "serial" && item.productSerialIds.length !== Number(item.qty);
    })) {
      setValidationError("Jumlah serial/IMEI yang dipilih harus sama dengan qty transfer.");
      return;
    }

    for (const item of items) {
      const inv = inventoryItems.find((entry) => entry.productId === item.productId && entry.productVariantId === item.productVariantId);
      if (inv && Number(item.qty) > inv.qtyAvailable) {
        setValidationError(
          `Qty transfer untuk ${inv.productName} (${Number(item.qty)}) melebihi stok tersedia (${inv.qtyAvailable}).`
        );
        return;
      }
    }

    const normalizedItems = items.map((item) => ({
      productId: item.productId,
      productVariantId: item.productVariantId,
      productBatchId: item.productBatchId || null,
      productSerialIds: item.productSerialIds.length > 0 ? item.productSerialIds : null,
      qty: Number(item.qty),
    }));

    if (normalizedItems.length === 0) {
      setValidationError("Isi minimal satu item transfer yang valid.");
      return;
    }

    const uniqueAllocations = new Set(normalizedItems.map((item) => `${item.productId}:${item.productVariantId ?? ""}:${item.productBatchId ?? ""}`));
    if (uniqueAllocations.size !== normalizedItems.length) {
      setValidationError("Produk dan batch transfer tidak boleh duplikat.");
      return;
    }

    await onSubmit({
      requestId,
      fromStockLocationId: fromOutletId,
      toStockLocationId: toOutletId,
      items: normalizedItems,
    });
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className="max-h-[90vh] max-w-5xl overflow-y-auto p-6 sm:p-8"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white p-5 pr-12 dark:border-brand-500/20 dark:from-brand-500/10 dark:via-gray-900 dark:to-gray-900">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand-500/15 blur-2xl"
          />
          <div className="relative flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="absolute inset-0 scale-125 rounded-3xl bg-brand-500/20 blur-lg" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/25">
                <PaperPlaneIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Buat transfer stok
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Kirim stok dari lokasi aktif ke tujuan. Stok sumber langsung berkurang dan
                stok tujuan bertambah setelah barang diterima.
              </p>
            </div>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <InlineAlert tone="error" message={submitError ?? validationError} />

          {/* Outlet */}
          <div className="grid gap-4 rounded-2xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02] md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Lokasi asal
              </span>
              <div className="relative">
                <BoxIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  value={outlets.find((outlet) => outlet.id === fromOutletId)?.name ?? "-"}
                  readOnly
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-100 pl-12 pr-3 text-sm text-gray-600 outline-none dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Lokasi tujuan <span className="text-error-500">*</span>
              </span>
              <div className="relative">
                <select
                  value={toOutletId}
                  onChange={(event) => setToOutletId(event.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-4 pr-11 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                >
                  <option value="">Pilih lokasi tujuan</option>
                  {selectableOutlets.map((outlet) => (
                    <option key={outlet.id} value={outlet.id}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>
            </label>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                  Item transfer
                </h4>
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                  {items.length} baris
                </span>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <PlusIcon className="h-4 w-4" />
                Tambah item
              </button>
            </div>
            <p className="-mt-2 text-xs text-gray-500 dark:text-gray-400">
              Stok referensi mengikuti lokasi asal yang sedang aktif.
            </p>

            {items.map((item, index) => {
              const selectedInventory = inventoryItems.find((entry) => entry.productId === item.productId && entry.productVariantId === item.productVariantId);
              const options = trackingOptions[item.id];
              const selectedBatch = options?.batches.find((batch) => batch.id === item.productBatchId);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/60 sm:p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Item {index + 1}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      aria-label={`Hapus item ${index + 1}`}
                      title={items.length === 1 ? "Minimal satu item transfer" : "Hapus item"}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-error-50 hover:text-error-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-error-500/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-300"
                    >
                      <TrashBinIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Produk <span className="text-error-500">*</span>
                      </span>
                      <div className="relative">
                        <select
                          value={selectedInventory ? inventoryKey(selectedInventory) : ""}
                          onChange={(event) => void selectInventory(index, event.target.value)}
                          className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-4 pr-11 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                        >
                          <option value="">Pilih produk</option>
                          {inventoryItems.map((entry) => (
                            <option key={inventoryKey(entry)} value={inventoryKey(entry)}>
                              {entry.productName} ({entry.sku}) · {entry.trackingMode}
                            </option>
                          ))}
                        </select>
                        <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      </div>
                    </label>

                    <div className="block">
                      <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Stok saat ini
                      </span>
                      <div className="flex h-11 items-center rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-200">
                        {selectedInventory ? formatQuantity(selectedInventory.qtyAvailable) : "-"}
                      </div>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Qty <span className="text-error-500">*</span>
                      </span>
                      <input
                        type="number"
                        min="0.01"
                        max={selectedBatch?.qtyAvailable ?? selectedInventory?.qtyAvailable}
                        step="0.01"
                        value={item.qty}
                        readOnly={selectedInventory?.trackingMode === "serial"}
                        onChange={(event) => updateItem(index, "qty", event.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition read-only:bg-gray-50 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:read-only:bg-white/[0.03]"
                      />
                      {selectedInventory && Number(item.qty) > selectedInventory.qtyAvailable && (
                        <p className="mt-1 text-xs text-error-600">Melebihi stok tersedia ({formatQuantity(selectedInventory.qtyAvailable)}).</p>
                      )}
                      <p className="mt-1 text-xs text-gray-400">Harus lebih besar dari 0.</p>
                    </label>
                  </div>

                  {selectedInventory?.trackingMode === "batch" && (
                    <label className="mt-3 block">
                      <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Batch</span>
                      <div className="relative">
                        <select
                          value={item.productBatchId}
                          onChange={(event) => updateItem(index, "productBatchId", event.target.value)}
                          className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-4 pr-11 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                        >
                          <option value="">Pilih batch</option>
                          {options?.batches.map((batch) => (
                            <option key={batch.id} value={batch.id}>
                              {batch.batchNumber} · tersedia {batch.qtyRemaining}{batch.expiryDate ? ` · exp ${new Date(batch.expiryDate).toLocaleDateString("id-ID")}` : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      </div>
                    </label>
                  )}

                  {selectedInventory?.trackingMode === "serial" && (
                    <div className="mt-3 space-y-2">
                      <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Serial / IMEI</span>
                      <div className="flex gap-2">
                        <input
                          value={serialSearch[item.id] ?? ""}
                          onChange={(event) => setSerialSearch((current) => ({ ...current, [item.id]: event.target.value }))}
                          placeholder="Ketik atau scan serial / IMEI"
                          className="h-10 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => void loadTracking(item, selectedInventory, serialSearch[item.id] ?? "")}
                          className="rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600"
                        >
                          Cari
                        </button>
                      </div>
                      <select
                        multiple
                        value={item.productSerialIds}
                        onChange={(event) => {
                          const ids = Array.from(event.currentTarget.selectedOptions, (option) => option.value);
                          setItems((current) => current.map((entry, itemIndex) => itemIndex === index
                            ? { ...entry, productSerialIds: ids, qty: String(ids.length) }
                            : entry));
                        }}
                        className="min-h-28 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      >
                        {options?.serials.map((serial) => <option key={serial.id} value={serial.id}>{serial.serialNumber}</option>)}
                      </select>
                      <p className="text-xs text-gray-400">Gunakan Ctrl/Cmd untuk memilih lebih dari satu.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {items.length} baris item · stok sumber berkurang ketika transfer dikirim.
            </p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-500/10 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <PaperPlaneIcon className="h-4 w-4" />
                {isSubmitting ? "Mengirim..." : "Kirim transfer"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}

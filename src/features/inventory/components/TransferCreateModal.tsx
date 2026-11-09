import { useEffect, useMemo, useState } from "react";
import { FormCard } from "../../../components/forms";
import { InlineAlert } from "../../../components/ui";
import type { OutletLookupDto } from "../../outlets/types/outlet";
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
  outlets: OutletLookupDto[];
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

  useEffect(() => {
    if (!open) {
      setToOutletId("");
      setItems([createDraftItem()]);
      setTrackingOptions({});
      setSerialSearch({});
      setValidationError(null);
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
      setValidationError("Outlet asal belum tersedia.");
      return;
    }

    if (!toOutletId) {
      setValidationError("Pilih outlet tujuan terlebih dahulu.");
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
      if (inv && Number(item.qty) > inv.qtyOnHand) {
        setValidationError(
          `Qty transfer untuk ${inv.productName} (${Number(item.qty)}) melebihi stok tersedia (${inv.qtyOnHand}).`
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
      fromStockLocationId: fromOutletId,
      toStockLocationId: toOutletId,
      items: normalizedItems,
    });
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto">
        <FormCard
          title="Buat transfer stok"
          description="Ajukan perpindahan stok dari outlet aktif ke outlet tujuan. Stok baru berubah saat transfer di-approve."
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            <InlineAlert tone="error" message={submitError ?? validationError} />

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Outlet asal
                </span>
                <input
                  value={outlets.find((outlet) => outlet.id === fromOutletId)?.name ?? "-"}
                  readOnly
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Outlet tujuan <span className="text-error-500">*</span>
                </span>
                <select
                  value={toOutletId}
                  onChange={(event) => setToOutletId(event.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                >
                  <option value="">Pilih outlet tujuan</option>
                  {selectableOutlets.map((outlet) => (
                    <option key={outlet.id} value={outlet.id}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Item transfer</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Stok referensi mengikuti outlet asal yang sedang aktif.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                >
                  Tambah item
                </button>
              </div>

              {items.map((item, index) => {
                const selectedInventory = inventoryItems.find((entry) => entry.productId === item.productId && entry.productVariantId === item.productVariantId);
                const options = trackingOptions[item.id];
                const selectedBatch = options?.batches.find((batch) => batch.id === item.productBatchId);

                return (
                  <div
                    key={item.id}
                    className="grid gap-3 rounded-2xl border border-gray-200 p-4 dark:border-gray-800 lg:grid-cols-[2.2fr_1fr_1fr_auto]"
                  >
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Produk <span className="text-error-500">*</span>
                      </span>
                      <select
                        value={selectedInventory ? inventoryKey(selectedInventory) : ""}
                        onChange={(event) => void selectInventory(index, event.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      >
                        <option value="">Pilih produk</option>
                        {inventoryItems.map((entry) => (
                          <option key={inventoryKey(entry)} value={inventoryKey(entry)}>
                            {entry.productName} ({entry.sku}) · {entry.trackingMode}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="block">
                      <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Stok saat ini
                      </span>
                      <div className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 flex items-center">
                        {selectedInventory ? formatQuantity(selectedInventory.qtyOnHand) : "-"}
                      </div>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Qty <span className="text-error-500">*</span>
                      </span>
                      <input
                        type="number"
                        min="0.01"
                        max={selectedBatch?.qtyRemaining ?? selectedInventory?.qtyOnHand}
                        step="0.01"
                        value={item.qty}
                        readOnly={selectedInventory?.trackingMode === "serial"}
                        onChange={(event) => updateItem(index, "qty", event.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                      {selectedInventory && Number(item.qty) > selectedInventory.qtyOnHand && (
                        <p className="mt-1 text-xs text-error-600">Melebihi stok tersedia ({formatQuantity(selectedInventory.qtyOnHand)}).</p>
                      )}
                      <p className="mt-1 text-xs text-gray-400">Harus lebih besar dari 0.</p>
                    </label>

                    {selectedInventory?.trackingMode === "batch" && (
                      <label className="block lg:col-span-3">
                        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Batch</span>
                        <select
                          value={item.productBatchId}
                          onChange={(event) => updateItem(index, "productBatchId", event.target.value)}
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                        >
                          <option value="">Pilih batch</option>
                          {options?.batches.map((batch) => (
                            <option key={batch.id} value={batch.id}>
                              {batch.batchNumber} · tersedia {batch.qtyRemaining}{batch.expiryDate ? ` · exp ${new Date(batch.expiryDate).toLocaleDateString("id-ID")}` : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {selectedInventory?.trackingMode === "serial" && (
                      <div className="block space-y-2 lg:col-span-3">
                        <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Serial / IMEI</span>
                        <div className="flex gap-2">
                          <input
                            value={serialSearch[item.id] ?? ""}
                            onChange={(event) => setSerialSearch((current) => ({ ...current, [item.id]: event.target.value }))}
                            placeholder="Ketik atau scan serial / IMEI"
                            className="h-10 flex-1 rounded-xl border border-gray-200 px-3 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => void loadTracking(item, selectedInventory, serialSearch[item.id] ?? "")}
                            className="rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white"
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
                          className="min-h-28 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                        >
                          {options?.serials.map((serial) => <option key={serial.id} value={serial.id}>{serial.serialNumber}</option>)}
                        </select>
                        <p className="mt-1 text-xs text-gray-400">Gunakan Ctrl/Cmd untuk memilih lebih dari satu.</p>
                      </div>
                    )}

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="h-11 rounded-xl border border-error-200 px-4 text-sm font-semibold text-error-700 dark:border-error-500/20 dark:text-error-300"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
              >
                {isSubmitting ? "Menyimpan..." : "Ajukan transfer"}
              </button>
            </div>
          </form>
        </FormCard>
      </div>
    </div>
  );
}

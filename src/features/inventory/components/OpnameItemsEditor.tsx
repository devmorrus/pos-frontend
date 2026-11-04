import { useState } from "react";
import { FieldErrorText } from "../../../components/forms";
import { getProductTrackingOptions } from "../../products/api/productsApi";
import type { ProductTrackingMode, ProductTrackingOptionsDto } from "../../products/types/product";
import type { InventoryListItem } from "../types/inventory";
import { formatQuantity } from "../utils/presentation";

export type OpnameDraftItem = {
  id: string;
  productId: string;
  productVariantId?: string | null;
  trackingMode?: ProductTrackingMode;
  productBatchId?: string;
  productSerialIds: string[];
  serials: { id: string; serialNumber: string }[];
  physicalQty: string;
};

function inventoryKey(item: Pick<InventoryListItem, "productId" | "productVariantId">) {
  return `${item.productId}::${item.productVariantId ?? "base"}`;
}

export default function OpnameItemsEditor({
  outletId,
  inventoryItems,
  items,
  onChange,
  onAddItem,
  onRemoveItem,
  warning,
}: {
  outletId: string;
  inventoryItems: InventoryListItem[];
  items: OpnameDraftItem[];
  onChange: (index: number, patch: Partial<OpnameDraftItem>) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  warning?: string | null;
}) {
  const [optionsByRow, setOptionsByRow] = useState<Record<string, ProductTrackingOptionsDto>>({});
  const [searchByRow, setSearchByRow] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadOptions(index: number, selected: InventoryListItem, search = "") {
    const row = items[index];
    if (!row || selected.trackingMode === "quantity") return;
    setLoadError(null);
    try {
      const options = await getProductTrackingOptions(
        selected.productId,
        outletId,
        selected.productVariantId,
        search,
        true,
      );
      setOptionsByRow((current) => ({
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
      setLoadError(`Gagal memuat ${selected.trackingMode} untuk ${selected.productName}.`);
    }
  }

  function selectInventory(index: number, value: string) {
    const selected = inventoryItems.find((entry) => inventoryKey(entry) === value);
    onChange(index, {
      productId: selected?.productId ?? "",
      productVariantId: selected?.productVariantId ?? null,
      trackingMode: selected?.trackingMode,
      productBatchId: "",
      productSerialIds: [],
      serials: [],
      physicalQty: "",
    });
    if (selected) void loadOptions(index, selected);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">Item opname</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Produk batch dihitung per batch. Produk serial dicentang sesuai unit yang ditemukan.
          </p>
        </div>
        <button type="button" onClick={onAddItem} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200">
          Tambah item
        </button>
      </div>

      <FieldErrorText message={warning ?? loadError} />

      <div className="space-y-3">
        {items.map((item, index) => {
          const selectedInventory = inventoryItems.find((entry) => entry.productId === item.productId && entry.productVariantId === item.productVariantId);
          const options = optionsByRow[item.id];
          const selectedBatch = options?.batches.find((batch) => batch.id === item.productBatchId);
          const systemQty = item.trackingMode === "batch" ? selectedBatch?.qtyRemaining : selectedInventory?.qtyOnHand;

          return (
            <div key={item.id} className="grid gap-3 rounded-2xl border border-gray-200 p-4 dark:border-gray-800 lg:grid-cols-[2.2fr_1fr_1fr_auto]">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Produk <span className="text-error-500">*</span></span>
                <select
                  value={selectedInventory ? inventoryKey(selectedInventory) : ""}
                  onChange={(event) => selectInventory(index, event.target.value)}
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

              <div>
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">System qty</span>
                <div className="flex h-11 items-center rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200">
                  {systemQty === undefined ? "-" : formatQuantity(systemQty)}
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Physical qty <span className="text-error-500">*</span></span>
                <input
                  type="number"
                  min="0"
                  step={item.trackingMode === "serial" ? "1" : "0.01"}
                  value={item.physicalQty}
                  readOnly={item.trackingMode === "serial"}
                  onChange={(event) => onChange(index, { physicalQty: event.target.value })}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none read-only:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
              </label>

              <div className="flex items-end">
                <button type="button" onClick={() => onRemoveItem(index)} className="h-11 rounded-xl border border-error-200 px-4 text-sm font-semibold text-error-700 dark:border-error-500/20 dark:text-error-300">
                  Hapus
                </button>
              </div>

              {item.trackingMode === "batch" && (
                <label className="lg:col-span-4">
                  <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Batch <span className="text-error-500">*</span></span>
                  <select
                    value={item.productBatchId}
                    onChange={(event) => onChange(index, { productBatchId: event.target.value, physicalQty: "" })}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  >
                    <option value="">Pilih batch</option>
                    {options?.batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.batchNumber} · sistem {batch.qtyRemaining}{batch.expiryDate ? ` · exp ${new Date(batch.expiryDate).toLocaleDateString("id-ID")}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {item.trackingMode === "serial" && selectedInventory && (
                <div className="space-y-3 lg:col-span-4">
                  <div className="flex gap-2">
                    <input
                      value={searchByRow[item.id] ?? ""}
                      onChange={(event) => setSearchByRow((current) => ({ ...current, [item.id]: event.target.value }))}
                      placeholder="Ketik atau scan serial / IMEI"
                      className="h-10 flex-1 rounded-xl border border-gray-200 px-3 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => void loadOptions(index, selectedInventory, searchByRow[item.id] ?? "")}
                      className="rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white"
                    >
                      Cari
                    </button>
                  </div>
                  <div className="flex max-h-52 flex-wrap gap-2 overflow-y-auto">
                    {options?.serials.map((serial) => {
                      const checked = item.productSerialIds.includes(serial.id);
                      return (
                        <label key={serial.id} className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs dark:border-gray-800">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              const serials = event.target.checked
                                ? [...item.serials, serial]
                                : item.serials.filter((entry) => entry.id !== serial.id);
                              onChange(index, {
                                serials,
                                productSerialIds: serials.map((entry) => entry.id),
                                physicalQty: String(serials.length),
                              });
                            }}
                          />
                          <span className="font-mono">{serial.serialNumber}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-xs text-warning-600 dark:text-warning-400">
                    Serial tersedia yang tidak dipilih akan ditandai written off saat opname disimpan.
                  </p>
                </div>
              )}

              <div className="text-xs text-gray-500 dark:text-gray-400 lg:col-span-4">
                Variance preview: {systemQty !== undefined && item.physicalQty !== "" ? formatQuantity(Number(item.physicalQty) - systemQty) : "-"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

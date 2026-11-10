import { useState } from "react";
import {
  AlertIcon,
  ChevronDownIcon,
  PlusIcon,
  TrashBinIcon,
} from "../../../icons";
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">Item opname</h4>
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
            {items.length} baris
          </span>
        </div>
        <button
          type="button"
          onClick={onAddItem}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <PlusIcon className="h-4 w-4" />
          Tambah item
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Produk batch dihitung per batch. Produk serial dicentang sesuai unit yang ditemukan.
      </p>

      {warning ?? loadError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-300">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{warning ?? loadError}</p>
        </div>
      ) : null}

      <div className="space-y-3">
        {items.map((item, index) => {
          const selectedInventory = inventoryItems.find((entry) => entry.productId === item.productId && entry.productVariantId === item.productVariantId);
          const options = optionsByRow[item.id];
          const selectedBatch = options?.batches.find((batch) => batch.id === item.productBatchId);
          const systemQty = item.trackingMode === "batch" ? selectedBatch?.qtyRemaining : selectedInventory?.qtyOnHand;
          const variance =
            systemQty !== undefined && item.physicalQty !== ""
              ? Number(item.physicalQty) - systemQty
              : null;
          const varianceTone =
            variance === null
              ? ""
              : variance === 0
                ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300"
                : variance > 0
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                  : "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-300";

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/60 sm:p-5"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Item {index + 1}
                  </p>
                  {variance !== null ? (
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${varianceTone}`}>
                      {variance === 0
                        ? "Sesuai"
                        : `Selisih ${variance > 0 ? "+" : ""}${formatQuantity(variance)}`}
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveItem(index)}
                  disabled={items.length === 1}
                  aria-label={`Hapus item ${index + 1}`}
                  title={items.length === 1 ? "Minimal satu item opname" : "Hapus item"}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-error-50 hover:text-error-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-error-500/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-300"
                >
                  <TrashBinIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Produk <span className="text-error-500">*</span></span>
                  <div className="relative">
                    <select
                      value={selectedInventory ? inventoryKey(selectedInventory) : ""}
                      onChange={(event) => selectInventory(index, event.target.value)}
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

                <div>
                  <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Stok sistem</span>
                  <div className="flex h-11 items-center rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-200">
                    {systemQty === undefined ? "-" : formatQuantity(systemQty)}
                  </div>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Stok fisik <span className="text-error-500">*</span></span>
                  <input
                    type="number"
                    min="0"
                    step={item.trackingMode === "serial" ? "1" : "0.01"}
                    value={item.physicalQty}
                    readOnly={item.trackingMode === "serial"}
                    onChange={(event) => onChange(index, { physicalQty: event.target.value })}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition read-only:bg-gray-50 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:read-only:bg-white/[0.03]"
                  />
                </label>
              </div>

              {item.trackingMode === "batch" && (
                <label className="mt-3 block">
                  <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Batch <span className="text-error-500">*</span></span>
                  <div className="relative">
                    <select
                      value={item.productBatchId}
                      onChange={(event) => onChange(index, { productBatchId: event.target.value, physicalQty: "" })}
                      className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-4 pr-11 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                    >
                      <option value="">Pilih batch</option>
                      {options?.batches.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.batchNumber} · sistem {batch.qtyRemaining}{batch.expiryDate ? ` · exp ${new Date(batch.expiryDate).toLocaleDateString("id-ID")}` : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  </div>
                </label>
              )}

              {item.trackingMode === "serial" && selectedInventory && (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Serial / IMEI</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {item.productSerialIds.length} dipilih
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={searchByRow[item.id] ?? ""}
                      onChange={(event) => setSearchByRow((current) => ({ ...current, [item.id]: event.target.value }))}
                      placeholder="Ketik atau scan serial / IMEI"
                      className="h-10 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => void loadOptions(index, selectedInventory, searchByRow[item.id] ?? "")}
                      className="rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600"
                    >
                      Cari
                    </button>
                  </div>
                  <div className="flex max-h-52 flex-wrap gap-2 overflow-y-auto">
                    {options?.serials.map((serial) => {
                      const checked = item.productSerialIds.includes(serial.id);
                      return (
                        <label
                          key={serial.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
                            checked
                              ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300"
                              : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
                          }`}
                        >
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
                            className="h-4 w-4 rounded border-gray-300 accent-brand-500"
                          />
                          <span className="font-mono">{serial.serialNumber}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="flex items-start gap-2 text-xs text-warning-600 dark:text-warning-400">
                    <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Serial tersedia yang tidak dipilih akan ditandai written off saat opname disimpan.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

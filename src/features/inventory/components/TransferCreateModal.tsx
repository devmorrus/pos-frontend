import { useEffect, useMemo, useState } from "react";
import { FormCard } from "../../../components/forms";
import { InlineAlert } from "../../../components/ui";
import type { OutletLookupDto } from "../../outlets/types/outlet";
import type { CreateStockTransferRequest, InventoryListItem } from "../types/inventory";
import { formatQuantity } from "../utils/presentation";

type TransferDraftItem = {
  productId: string;
  qty: string;
};

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
  const [items, setItems] = useState<TransferDraftItem[]>([{ productId: "", qty: "" }]);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setToOutletId("");
      setItems([{ productId: "", qty: "" }]);
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

  function addItem() {
    setItems((current) => [...current, { productId: "", qty: "" }]);
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

    for (const item of items) {
      const inv = inventoryItems.find((entry) => entry.productId === item.productId);
      if (inv && Number(item.qty) > inv.qtyOnHand) {
        setValidationError(
          `Qty transfer untuk ${inv.productName} (${Number(item.qty)}) melebihi stok tersedia (${inv.qtyOnHand}).`
        );
        return;
      }
    }

    const normalizedItems = items.map((item) => ({
      productId: item.productId,
      qty: Number(item.qty),
    }));

    if (normalizedItems.length === 0) {
      setValidationError("Isi minimal satu item transfer yang valid.");
      return;
    }

    const uniqueProductIds = new Set(normalizedItems.map((item) => item.productId));
    if (uniqueProductIds.size !== normalizedItems.length) {
      setValidationError("Produk transfer tidak boleh duplikat.");
      return;
    }

    await onSubmit({
      fromOutletId,
      toOutletId,
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
                const selectedInventory = inventoryItems.find((entry) => entry.productId === item.productId);

                return (
                  <div
                    key={`${index}-${item.productId}`}
                    className="grid gap-3 rounded-2xl border border-gray-200 p-4 dark:border-gray-800 lg:grid-cols-[2.2fr_1fr_1fr_auto]"
                  >
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Produk <span className="text-error-500">*</span>
                      </span>
                      <select
                        value={item.productId}
                        onChange={(event) => updateItem(index, "productId", event.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      >
                        <option value="">Pilih produk</option>
                        {inventoryItems.map((entry) => (
                          <option key={entry.productId} value={entry.productId}>
                            {entry.productName} ({entry.sku})
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
                        step="0.01"
                        value={item.qty}
                        onChange={(event) => updateItem(index, "qty", event.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                      {selectedInventory && Number(item.qty) > selectedInventory.qtyOnHand && (
                        <p className="mt-1 text-xs text-error-600">Melebihi stok tersedia ({formatQuantity(selectedInventory.qtyOnHand)}).</p>
                      )}
                      <p className="mt-1 text-xs text-gray-400">Harus lebih besar dari 0.</p>
                    </label>

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

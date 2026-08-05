import { FieldErrorText } from "../../../components/forms";
import type { InventoryListItem } from "../types/inventory";
import { formatQuantity } from "../utils/presentation";

export type OpnameDraftItem = {
  productId: string;
  physicalQty: string;
};

export default function OpnameItemsEditor({
  inventoryItems,
  items,
  onChange,
  onAddItem,
  onRemoveItem,
  warning,
}: {
  inventoryItems: InventoryListItem[];
  items: OpnameDraftItem[];
  onChange: (index: number, key: keyof OpnameDraftItem, value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  warning?: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-gray-900 dark:text-white">Item opname</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            System qty akan mengikuti stok terakhir pada outlet aktif.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddItem}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
        >
          Tambah item
        </button>
      </div>

      <FieldErrorText message={warning} />

      <div className="space-y-3">
        {items.map((item, index) => {
          const selectedInventory = inventoryItems.find((entry) => entry.productId === item.productId);

          return (
            <div
              key={`${item.productId}-${index}`}
              className="grid gap-3 rounded-2xl border border-gray-200 p-4 dark:border-gray-800 lg:grid-cols-[2.2fr_1fr_1fr_auto]"
            >
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Produk <span className="text-error-500">*</span>
                </span>
                <select
                  value={item.productId}
                  onChange={(event) => onChange(index, "productId", event.target.value)}
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
                  System qty
                </span>
                <div className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 flex items-center">
                  {selectedInventory ? formatQuantity(selectedInventory.qtyOnHand) : "-"}
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Physical qty <span className="text-error-500">*</span>
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.physicalQty}
                  onChange={(event) => onChange(index, "physicalQty", event.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-400">Harus berupa angka 0 atau lebih.</p>
              </label>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => onRemoveItem(index)}
                  className="h-11 rounded-xl border border-error-200 px-4 text-sm font-semibold text-error-700 dark:border-error-500/20 dark:text-error-300"
                >
                  Hapus
                </button>
              </div>

              <div className="lg:col-span-4 text-xs text-gray-500 dark:text-gray-400">
                Variance preview:{" "}
                {selectedInventory && item.physicalQty !== ""
                  ? formatQuantity(Number(item.physicalQty) - selectedInventory.qtyOnHand)
                  : "-"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

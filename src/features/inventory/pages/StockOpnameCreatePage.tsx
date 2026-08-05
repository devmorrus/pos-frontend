import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { FormCard } from "../../../components/forms";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { useRealtime } from "../../../lib/realtime/hooks";
import { getErrorMessage } from "../../../utils/errors";
import { createStockOpname, getInventory } from "../api/inventoryApi";
import OpnameItemsEditor, { type OpnameDraftItem } from "../components/OpnameItemsEditor";
import type { InventoryListItem } from "../types/inventory";
import { useStockOutletScope } from "../hooks/useStockOutletScope";

export default function StockOpnameCreatePage() {
  const navigate = useNavigate();
  const { effectiveOutletId, ownerMode } = useStockOutletScope();
  const { onStockUpdate } = useRealtime();
  const [inventoryItems, setInventoryItems] = useState<InventoryListItem[]>([]);
  const [items, setItems] = useState<OpnameDraftItem[]>([{ productId: "", physicalQty: "" }]);
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
          outletId: effectiveOutletId,
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
      if (event.outletId === effectiveOutletId) {
        setWarning("Stok sistem baru saja berubah oleh transaksi lain. Periksa kembali angka system qty sebelum submit opname.");
        void loadInventoryLookup();
      }
    });

    return unsubscribe;
  }, [effectiveOutletId, onStockUpdate]);

  function updateItem(index: number, key: keyof OpnameDraftItem, value: string) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    );
  }

  function addItem() {
    setItems((current) => [...current, { productId: "", physicalQty: "" }]);
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

    const normalizedItems = items.map((item) => ({
      productId: item.productId,
      physicalQty: Number(item.physicalQty),
    }));

    if (normalizedItems.length === 0) {
      setError("Isi minimal satu item opname yang valid.");
      return;
    }

    const uniqueIds = new Set(normalizedItems.map((item) => item.productId));
    if (uniqueIds.size !== normalizedItems.length) {
      setError("Produk opname tidak boleh duplikat.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createStockOpname({
        outletId: effectiveOutletId,
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
      <InlineAlert tone="info" message={warning} />

      {ownerMode && !effectiveOutletId ? (
        <PagePlaceholder
          title="Pilih outlet aktif terlebih dahulu"
          description="Kembali ke inventory atau histori opname untuk memilih outlet kerja sebelum membuat stock opname."
          status="Outlet required"
        />
      ) : isLoading ? (
        <AppLoader label="Memuat data inventory..." />
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <FormCard
            title="Form stock opname"
            description="Setiap item akan membandingkan system qty dengan physical qty, lalu backend menghitung variance dan ledger penyesuaiannya."
          >
            <OpnameItemsEditor
              inventoryItems={inventoryItems}
              items={items}
              onChange={updateItem}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              warning={warning}
            />

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/stock-opnames")}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan stock opname"}
              </button>
            </div>
          </FormCard>
        </form>
      )}
    </ProtectedPageShell>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import ProcurementOutletSelector from "../../procurement/components/ProcurementOutletSelector";
import { useProcurementOutletScope } from "../../procurement/hooks/useProcurementOutletScope";
import { getErrorMessage } from "../../../utils/errors";
import { getSuppliers } from "../../suppliers/api/suppliersApi";
import type { SupplierDto } from "../../suppliers/types/supplier";
import {
  createSupplierReturn,
  getEligibleSupplierReturnItems,
  getEligibleSupplierReturnPurchaseOrders,
  getSupplierReturnById,
  updateSupplierReturn,
} from "../api/supplierReturnsApi";
import type {
  SupplierReturnDto,
  SupplierReturnFormRow,
  SupplierReturnItemDto,
  SupplierReturnPurchaseOrderLookupDto,
} from "../types/supplierReturn";
import { formatCurrency, formatDateOnly } from "../utils/formatters";

function toInputDate(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default function SupplierReturnFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const { ownerMode, activeOutlets, effectiveOutletId, selectedOutletId, setSelectedOutletId } =
    useProcurementOutletScope();
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<SupplierReturnPurchaseOrderLookupDto[]>([]);
  const [eligibleItems, setEligibleItems] = useState<SupplierReturnItemDto[]>([]);
  const [existing, setExisting] = useState<SupplierReturnDto | null>(null);
  const [supplierId, setSupplierId] = useState("");
  const [purchaseOrderId, setPurchaseOrderId] = useState("");
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<SupplierReturnFormRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBase() {
      setIsLoading(true);
      setError(null);
      try {
        const suppliersResult = await getSuppliers();
        setSuppliers(suppliersResult);

        if (isEditMode && id) {
          const detail = await getSupplierReturnById(id);
          setExisting(detail);
          setSupplierId(detail.supplierId);
          setPurchaseOrderId(detail.purchaseOrderId);
          setReturnDate(toInputDate(detail.returnDate));
          setNotes(detail.notes ?? "");
          setRows(detail.items.map((item) => ({ productId: item.productId, qty: String(item.qty) })));
          setEligibleItems(
            detail.items.map((item) => ({
              ...item,
              eligibleQty: item.eligibleQty + item.qty,
            })),
          );
        }
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat form retur supplier."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadBase();
  }, [id, isEditMode]);

  useEffect(() => {
    async function loadPurchaseOrders() {
      if (!effectiveOutletId || !supplierId || isEditMode) {
        setPurchaseOrders([]);
        return;
      }

      try {
        setPurchaseOrders(
          await getEligibleSupplierReturnPurchaseOrders({
            outletId: effectiveOutletId,
            supplierId,
          }),
        );
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat purchase order eligible."));
      }
    }

    void loadPurchaseOrders();
  }, [effectiveOutletId, supplierId, isEditMode]);

  useEffect(() => {
    async function loadItems() {
      if (!purchaseOrderId || (isEditMode && existing)) {
        return;
      }

      try {
        const items = await getEligibleSupplierReturnItems(purchaseOrderId);
        setEligibleItems(items);
        setRows(items.map((item) => ({ productId: item.productId, qty: "" })));
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat item PO yang bisa diretur."));
      }
    }

    void loadItems();
  }, [purchaseOrderId, isEditMode, existing]);

  const selectedPurchaseOrder = useMemo(
    () => purchaseOrders.find((purchaseOrder) => purchaseOrder.id === purchaseOrderId) ?? null,
    [purchaseOrders, purchaseOrderId],
  );
  const shouldShowOutletPrompt = ownerMode && !effectiveOutletId && !isEditMode;

  const rowLookup = useMemo(
    () => new Map(rows.map((row) => [row.productId, row.qty])),
    [rows],
  );

  const totalAmount = useMemo(
    () =>
      eligibleItems.reduce((sum, item) => {
        const qty = Number(rowLookup.get(item.productId) ?? 0);
        return sum + (Number.isFinite(qty) ? qty : 0) * item.unitCost;
      }, 0),
    [eligibleItems, rowLookup],
  );

  function updateQty(productId: string, qty: string) {
    setRows((current) =>
      current.map((row) => (row.productId === productId ? { ...row, qty } : row)),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if ((!effectiveOutletId && !isEditMode) || !supplierId || !purchaseOrderId) {
      setError("Lengkapi outlet, supplier, dan purchase order terlebih dahulu.");
      return;
    }

    const selectedItems = rows
      .map((row) => ({ productId: row.productId, qty: Number(row.qty || 0) }))
      .filter((row) => row.qty > 0);

    if (selectedItems.length === 0) {
      setError("Minimal satu item retur dengan qty lebih dari 0 wajib diisi.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isEditMode && id) {
        const result = await updateSupplierReturn(id, {
          returnDate,
          notes: notes.trim() || null,
          items: selectedItems,
        });
        navigate(`/supplier-returns/${result.id}`, {
          replace: true,
          state: { successMessage: `Retur ${result.returnNumber} berhasil diperbarui.` },
        });
      } else {
        const result = await createSupplierReturn({
          supplierId,
          purchaseOrderId,
          returnDate,
          notes: notes.trim() || null,
          items: selectedItems,
        });
        navigate(`/supplier-returns/${result.id}`, {
          replace: true,
          state: { successMessage: `Retur ${result.returnNumber} berhasil dibuat.` },
        });
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal menyimpan retur supplier."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ProtectedPageShell
      title={isEditMode ? "Edit Supplier Return" : "Buat Supplier Return"}
      description="Pilih purchase order yang sudah selesai lalu tentukan item dan qty barang yang dikembalikan ke supplier."
    >
      <InlineAlert tone="error" message={error} />

      {isLoading ? (
        <AppLoader label="Memuat form retur supplier..." />
      ) : shouldShowOutletPrompt ? (
        <PagePlaceholder
          title="Pilih outlet procurement terlebih dahulu"
          description="Owner perlu memilih outlet aktif sebelum membuat retur supplier."
          status="Outlet required"
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isEditMode ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-wrap gap-4">
                <ProcurementOutletSelector
                  ownerMode={ownerMode}
                  value={selectedOutletId}
                  onChange={setSelectedOutletId}
                  outlets={activeOutlets}
                />
                <select
                  value={supplierId}
                  onChange={(event) => {
                    setSupplierId(event.target.value);
                    setPurchaseOrderId("");
                    setEligibleItems([]);
                    setRows([]);
                  }}
                  className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                >
                  <option value="">Pilih supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                <select
                  value={purchaseOrderId}
                  onChange={(event) => setPurchaseOrderId(event.target.value)}
                  className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                >
                  <option value="">Pilih purchase order</option>
                  {purchaseOrders.map((purchaseOrder) => (
                    <option key={purchaseOrder.id} value={purchaseOrder.id}>
                      {purchaseOrder.poNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Item retur</h3>
              </div>
              {eligibleItems.length === 0 ? (
                <div className="p-6">
                  <PagePlaceholder
                    title="Belum ada item retur"
                    description="Pilih purchase order untuk memuat item barang yang masih bisa diretur."
                    status="Waiting"
                  />
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-950">
                    <tr>
                      {["Produk", "Eligible Qty", "Unit Cost", "Qty Retur", "Subtotal"].map((column) => (
                        <th
                          key={column}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {eligibleItems.map((item) => {
                      const qty = rowLookup.get(item.productId) ?? "";
                      return (
                        <tr key={item.productId}>
                          <td className="px-4 py-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.sku}</p>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{item.eligibleQty}</td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(item.unitCost)}</td>
                          <td className="px-4 py-4">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              max={item.eligibleQty}
                              value={qty}
                              onChange={(event) => updateQty(item.productId, event.target.value)}
                              className="h-11 w-32 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                            />
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency((Number(qty || 0) || 0) * item.unitCost)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Informasi retur</h3>
                <div className="mt-4 space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Tanggal retur</span>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(event) => setReturnDate(event.target.value)}
                      className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Catatan</span>
                    <textarea
                      rows={4}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                    />
                  </label>
                  <div className="rounded-2xl border border-dashed border-gray-300 p-4 text-sm dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-300">Purchase Order</p>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                      {existing?.purchaseOrderNumber ?? selectedPurchaseOrder?.poNumber ?? "-"}
                    </p>
                    <p className="mt-3 text-gray-600 dark:text-gray-300">Total retur</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</p>
                    <p className="mt-3 text-gray-600 dark:text-gray-300">Tanggal PO</p>
                    <p className="mt-1 font-medium text-gray-900 dark:text-white">
                      {formatDateOnly(selectedPurchaseOrder?.poDate ?? existing?.returnDate ?? null)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Link
                  to={isEditMode && id ? `/supplier-returns/${id}` : "/supplier-returns"}
                  className="inline-flex items-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                >
                  Batal
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  {isSaving ? "Menyimpan..." : isEditMode ? "Simpan perubahan" : "Simpan draft"}
                </button>
              </div>
            </div>
          </section>
        </form>
      )}
    </ProtectedPageShell>
  );
}

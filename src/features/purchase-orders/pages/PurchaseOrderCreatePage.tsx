import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { FieldErrorText, FormCard } from "../../../components/forms";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, ConfirmDialog, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { getProducts } from "../../products/api/productsApi";
import type { ProductDto } from "../../products/types/product";
import ProcurementOutletSelector from "../../procurement/components/ProcurementOutletSelector";
import { useProcurementOutletScope } from "../../procurement/hooks/useProcurementOutletScope";
import { formatCurrency } from "../../procurement/utils/formatters";
import { getSuppliers } from "../../suppliers/api/suppliersApi";
import type { SupplierDto } from "../../suppliers/types/supplier";
import { createPurchaseOrder } from "../api/purchaseOrdersApi";
import { validatePurchaseOrderForm } from "../schemas/purchaseOrderSchema";
import type { PurchaseOrderFormRow, PurchaseOrderFormValues } from "../types/purchaseOrder";

const initialRow: PurchaseOrderFormRow = {
  productId: "",
  qty: "1",
  unitCost: "",
};

const initialValues: PurchaseOrderFormValues = {
  supplierId: "",
  paymentType: "cash",
  dueDate: "",
  items: [initialRow],
};

export default function PurchaseOrderCreatePage() {
  const navigate = useNavigate();
  const { ownerMode, activeOutlets, effectiveOutletId, selectedOutletId, setSelectedOutletId } =
    useProcurementOutletScope();
  const [values, setValues] = useState<PurchaseOrderFormValues>(initialValues);
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  useEffect(() => {
    async function loadLookups() {
      if (!effectiveOutletId) {
        setProducts([]);
        setSuppliers([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setSubmitError(null);

      try {
        const [suppliersResult, productsResult] = await Promise.all([
          getSuppliers(),
          getProducts({ outletId: effectiveOutletId }),
        ]);
        setSuppliers(suppliersResult);
        setProducts(productsResult);
      } catch (requestError) {
        setSubmitError(getErrorMessage(requestError, "Gagal memuat lookup purchase order."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadLookups();
  }, [effectiveOutletId]);

  const shouldShowOutletPrompt = ownerMode && !effectiveOutletId;

  const productNameById = useMemo(
    () => new Map(products.map((product) => [product.id, `${product.sku} · ${product.name}`])),
    [products],
  );

  const confirmSubmitDescription = useMemo(() => {
    const warningItems = values.items
      .map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) return null;
        const cost = Number(item.unitCost || 0);
        const exceedsSelling = cost > prod.basePrice;
        const exceedsCost = cost > prod.costPrice;

        if (exceedsSelling || exceedsCost) {
          return {
            name: prod.name,
            cost,
            sellingPrice: prod.basePrice,
            prevCostPrice: prod.costPrice,
            exceedsSelling,
            exceedsCost,
          };
        }
        return null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    return (
      <div className="space-y-3 text-left">
        <p className="text-sm">
          Terdapat item pembelian dengan harga beli melebihi harga jual atau harga modal sebelumnya:
        </p>
        <div className="rounded-2xl bg-warning-50 p-4 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300 space-y-2">
          <ul className="list-disc pl-4 text-xs space-y-2">
            {warningItems.map((item, idx) => (
              <li key={idx}>
                <span className="font-semibold">{item.name}</span>
                <ul className="list-circle pl-4 mt-0.5 space-y-0.5">
                  <li>Unit Cost Baru: {formatCurrency(item.cost)}</li>
                  {item.exceedsSelling && (
                    <li className="text-error-600 dark:text-error-400 font-semibold">
                      ⚠️ Melebihi Harga Jual Saat Ini ({formatCurrency(item.sellingPrice)})
                    </li>
                  )}
                  {item.exceedsCost && (
                    <li>
                      ⚠️ Melebihi Modal Sebelumnya ({formatCurrency(item.prevCostPrice)})
                    </li>
                  )}
                </ul>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm font-semibold">
          Apakah Anda yakin ingin tetap menyimpan dokumen Purchase Order ini?
        </p>
      </div>
    );
  }, [values.items, products]);

  function updateValue<Key extends keyof PurchaseOrderFormValues>(key: Key, value: PurchaseOrderFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateItem(index: number, key: keyof PurchaseOrderFormRow, value: string) {
    setValues((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function addRow() {
    setValues((current) => ({ ...current, items: [...current.items, initialRow] }));
  }

  function removeRow(index: number) {
    setValues((current) => ({
      ...current,
      items: current.items.length === 1 ? current.items : current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  const totalAmount = useMemo(
    () =>
      values.items.reduce((total, item) => total + Number(item.qty || 0) * Number(item.unitCost || 0), 0),
    [values.items],
  );

  async function handleActualSubmit() {
    if (!effectiveOutletId) {
      setSubmitError("Pilih outlet procurement terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setShowConfirmSubmit(false);

    try {
      const result = await createPurchaseOrder({
        supplierId: values.supplierId,
        outletId: effectiveOutletId,
        paymentType: values.paymentType,
        dueDate: values.paymentType === "tempo" ? new Date(values.dueDate).toISOString() : null,
        items: values.items.map((item) => ({
          productId: item.productId,
          qty: Number(item.qty),
          unitCost: Number(item.unitCost),
        })),
      });

      navigate(`/purchase-orders/${result.id}`, {
        replace: true,
        state: { successMessage: `PO ${result.poNumber} berhasil dibuat.` },
      });
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError, "Gagal membuat purchase order."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validatePurchaseOrderForm(values);
    setErrors(nextErrors);
    setSubmitError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!effectiveOutletId) {
      setSubmitError("Pilih outlet procurement terlebih dahulu.");
      return;
    }

    const hasWarnings = values.items.some((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) return false;
      const cost = Number(item.unitCost || 0);
      return cost > prod.basePrice || cost > prod.costPrice;
    });

    if (hasWarnings) {
      setShowConfirmSubmit(true);
    } else {
      await handleActualSubmit();
    }
  }

  return (
    <ProtectedPageShell
      title="Buat Purchase Order"
      description="Catat pembelian supplier cash atau tempo untuk outlet procurement aktif."
    >
      <InlineAlert tone="error" message={submitError} />

      <FormCard
        title="Konteks outlet procurement"
        description="Owner dapat mengganti outlet procurement aktif. Admin dan Keuangan memakai outlet yang terikat pada akun."
      >
        <ProcurementOutletSelector
          ownerMode={ownerMode}
          value={selectedOutletId}
          onChange={setSelectedOutletId}
          outlets={activeOutlets}
        />
      </FormCard>

      {isLoading ? (
        <AppLoader label="Memuat lookup purchase order..." />
      ) : shouldShowOutletPrompt ? (
        <PagePlaceholder
          title="Pilih outlet procurement terlebih dahulu"
          description="Owner perlu menentukan outlet aktif sebelum membuat purchase order."
          status="Outlet required"
        />
      ) : (
        <FormCard
          title="Form purchase order"
          description="Tentukan supplier, tipe pembayaran, dan daftar item pembelian."
        >
          <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Supplier</span>
                <select
                  value={values.supplierId}
                  onChange={(event) => updateValue("supplierId", event.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                >
                  <option value="">Pilih supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                <FieldErrorText message={errors.supplierId} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Tipe pembayaran</span>
                <select
                  value={values.paymentType}
                  onChange={(event) => {
                    const nextVal = event.target.value as "cash" | "tempo" | "consignment";
                    setValues((current) => ({
                      ...current,
                      paymentType: nextVal,
                      dueDate: nextVal === "tempo" ? current.dueDate : "",
                    }));
                  }}
                  className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                >
                  <option value="cash">Cash</option>
                  <option value="tempo">Tempo</option>
                  <option value="consignment">Konsinyasi</option>
                </select>
              </label>
            </div>

            {values.paymentType === "tempo" ? (
              <label className="block max-w-sm">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Jatuh tempo</span>
                <input
                  type="date"
                  value={values.dueDate}
                  onChange={(event) => updateValue("dueDate", event.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
                <FieldErrorText message={errors.dueDate} />
              </label>
            ) : null}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Item purchase order</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Tambahkan produk dari outlet aktif beserta qty dan unit cost pembelian.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addRow}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                >
                  Tambah item
                </button>
              </div>
              <FieldErrorText message={errors.items} />

              <div className="space-y-4">
                {values.items.map((item, index) => {
                  const lineTotal = Number(item.qty || 0) * Number(item.unitCost || 0);
                  const selectedProduct = products.find((product) => product.id === item.productId);

                  return (
                    <div key={`${index}-${item.productId}`} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                      <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_auto]">
                        <label className="block">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Produk</span>
                          <select
                            value={item.productId}
                            onChange={(event) => updateItem(index, "productId", event.target.value)}
                            className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                          >
                            <option value="">Pilih produk</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {productNameById.get(product.id)}
                              </option>
                            ))}
                          </select>
                          <FieldErrorText message={errors[`items.${index}.productId`]} />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Qty</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.qty}
                            onChange={(event) => updateItem(index, "qty", event.target.value)}
                            className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                          />
                          <FieldErrorText message={errors[`items.${index}.qty`]} />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Unit cost</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(event) => updateItem(index, "unitCost", event.target.value)}
                            className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                          />
                          <FieldErrorText message={errors[`items.${index}.unitCost`]} />
                          {selectedProduct && item.unitCost && Number(item.unitCost) > selectedProduct.basePrice && (
                            <p className="mt-1.5 text-[11px] font-semibold text-error-600 dark:text-error-400 flex items-center gap-1">
                              <span>⚠️</span> Melebihi harga jual ({formatCurrency(selectedProduct.basePrice)})
                            </p>
                          )}
                        </label>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            disabled={values.items.length === 1}
                            className="h-11 rounded-xl border border-error-200 px-4 text-sm font-semibold text-error-700 disabled:opacity-50 dark:border-error-500/20 dark:text-error-300"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <span>Produk terpilih: {selectedProduct ? `${selectedProduct.sku} · ${selectedProduct.name}` : "-"}</span>
                        <span>Line total: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(lineTotal)}</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-gray-300 px-5 py-4 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">
              Total PO: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</span>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/purchase-orders")}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan purchase order"}
              </button>
            </div>
          </form>
        </FormCard>
      )}

      <ConfirmDialog
        open={showConfirmSubmit}
        title="Peringatan Harga Item"
        description={confirmSubmitDescription}
        confirmLabel="Ya, simpan PO"
        isBusy={isSubmitting}
        onCancel={() => setShowConfirmSubmit(false)}
        onConfirm={() => void handleActualSubmit()}
      />
    </ProtectedPageShell>
  );
}

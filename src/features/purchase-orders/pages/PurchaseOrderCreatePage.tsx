import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { FieldErrorText, FormCard } from "../../../components/forms";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, ConfirmDialog, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { BoxIcon, CheckLineIcon, DocsIcon, DollarLineIcon, GroupIcon, PlusIcon, TrashBinIcon } from "../../../icons";
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
import { getStockLocations } from "../../stock-locations/api";
import type { StockLocationDto } from "../../stock-locations/types";

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

const getTomorrowString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
};

export default function PurchaseOrderCreatePage() {
  const navigate = useNavigate();
  const { ownerMode, activeOutlets, effectiveOutletId, selectedOutletId, setSelectedOutletId } =
    useProcurementOutletScope();
  const [values, setValues] = useState<PurchaseOrderFormValues>(initialValues);
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [stockLocations, setStockLocations] = useState<StockLocationDto[]>([]);
  const [destinationStockLocationId, setDestinationStockLocationId] = useState("");
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
        const [suppliersResult, productsResult, locationsResult] = await Promise.all([
          getSuppliers(),
          getProducts({ outletId: effectiveOutletId }),
          getStockLocations(),
        ]);
        setSuppliers(suppliersResult);
        setProducts(productsResult.filter((product) => !product.isConsignment));
        setStockLocations(locationsResult.filter((location) => location.isActive));
        setDestinationStockLocationId((current) => current || effectiveOutletId);
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
        destinationStockLocationId: destinationStockLocationId || effectiveOutletId,
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

      <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-brand-50 via-white to-white p-6 shadow-theme-xs dark:border-gray-800 dark:from-brand-500/10 dark:via-gray-900 dark:to-gray-900 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/25"><DocsIcon className="h-8 w-8" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Procurement workspace</p><h3 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">Buat purchase order baru</h3><p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Catat kebutuhan pembelian supplier dengan data yang lengkap dan mudah dilacak.</p></div></div>
          <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-brand-100 bg-white/70 px-4 py-3 text-sm text-brand-700 dark:border-brand-500/20 dark:bg-gray-900/60 dark:text-brand-300"><CheckLineIcon className="h-5 w-5" /> Draft tersimpan saat dikirim</div>
        </div>
      </section>

      <FormCard
        title="Konteks outlet procurement"
        description="Owner dapat mengganti outlet procurement aktif. Admin dan Keuangan memakai outlet yang terikat pada akun."
      >
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"><BoxIcon className="h-5 w-5" /></div><div><h3 className="text-xl font-semibold text-gray-900 dark:text-white">Konteks outlet procurement</h3><p className="text-sm text-gray-600 dark:text-gray-300">Owner dapat mengganti outlet procurement aktif. Admin dan Keuangan memakai outlet yang terikat pada akun.</p></div></div>
        <div className="mt-6"><ProcurementOutletSelector
          ownerMode={ownerMode}
          value={selectedOutletId}
          onChange={setSelectedOutletId}
          outlets={activeOutlets}
        /></div>
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
          <form className="space-y-7" onSubmit={(event) => void handleSubmit(event)}>
            <div className="flex items-center gap-3 border-b border-gray-100 pb-5 dark:border-gray-800"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"><GroupIcon className="h-5 w-5" /></div><div><h4 className="text-base font-semibold text-gray-900 dark:text-white">Informasi pembelian</h4><p className="text-sm text-gray-500 dark:text-gray-400">Pilih partner supplier, lokasi penerimaan, dan cara pembayaran.</p></div></div>
            <div className="grid gap-5 md:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Supplier</span>
                <select
                  value={values.supplierId}
                  onChange={(event) => updateValue("supplierId", event.target.value)}
                   className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
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
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Lokasi penerimaan stok</span>
                <select
                  value={destinationStockLocationId}
                  onChange={(event) => setDestinationStockLocationId(event.target.value)}
                   className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                >
                  {stockLocations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} ({location.type === "warehouse" ? "Gudang" : "Outlet"})
                    </option>
                  ))}
                </select>
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
                      dueDate: nextVal === "tempo" ? (current.dueDate || getTomorrowString()) : "",
                    }));
                  }}
                   className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
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
                <div className="relative mt-2">
                  <input
                    type="date"
                    value={values.dueDate}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    onChange={(event) => updateValue("dueDate", event.target.value)}
                     className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-4 pr-10 text-sm text-gray-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                      />
                    </svg>
                  </div>
                </div>
                <FieldErrorText message={errors.dueDate} />
              </label>
            ) : null}

            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-300"><BoxIcon className="h-5 w-5" /></div><div><h4 className="text-base font-semibold text-gray-900 dark:text-white">Item purchase order</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Tambahkan produk dari outlet aktif beserta qty dan unit cost pembelian.
                  </p></div></div>
                </div>
                <button
                  type="button"
                  onClick={addRow}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 dark:border-brand-500/30 dark:text-brand-300 dark:hover:bg-brand-500/10"
                >
                  <PlusIcon className="h-4 w-4" />
                  Tambah item
                </button>
              </div>
              <FieldErrorText message={errors.items} />

              <div className="space-y-4">
                {values.items.map((item, index) => {
                  const lineTotal = Number(item.qty || 0) * Number(item.unitCost || 0);
                  const selectedProduct = products.find((product) => product.id === item.productId);

                  return (
                    <div key={`${index}-${item.productId}`} className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 transition hover:border-brand-200 dark:border-gray-800 dark:bg-gray-950/40 dark:hover:border-brand-800">
                      <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_auto]">
                        <label className="block">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Produk</span>
                          <select
                            value={item.productId}
                            onChange={(event) => updateItem(index, "productId", event.target.value)}
                             className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
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
                             className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
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
                             className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
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
                             className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-error-200 px-4 text-sm font-semibold text-error-700 transition hover:bg-error-50 disabled:opacity-50 dark:border-error-500/20 dark:text-error-300 dark:hover:bg-error-500/10"
                          >
                            <TrashBinIcon className="h-4 w-4" />
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

             <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-brand-50 to-brand-100/60 px-5 py-5 text-sm text-brand-800 dark:from-brand-500/10 dark:to-brand-500/5 dark:text-brand-200">
               <span className="flex items-center gap-2 font-semibold"><DollarLineIcon className="h-5 w-5" /> Total purchase order</span><span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</span>
            </div>

             <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-end dark:border-gray-800">
              <button
                type="button"
                onClick={() => navigate("/purchase-orders")}
                 className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                 className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 disabled:opacity-70"
              >
                <CheckLineIcon className="h-4 w-4" />
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

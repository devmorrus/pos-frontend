import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { FieldErrorText, FormCard } from "../../../components/forms";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { getProducts } from "../../products/api/productsApi";
import type { ProductDto } from "../../products/types/product";
import ProcurementOutletSelector from "../../procurement/components/ProcurementOutletSelector";
import { useProcurementOutletScope } from "../../procurement/hooks/useProcurementOutletScope";
import { getSuppliers } from "../../suppliers/api/suppliersApi";
import type { SupplierDto } from "../../suppliers/types/supplier";
import { createConsignment } from "../api/consignmentsApi";
import { formatCurrency } from "../utils/formatters";
import type { ConsignmentFormRow, ConsignmentFormValues } from "../types/consignment";

const initialRow: ConsignmentFormRow = {
  productId: "",
  qty: "1",
  unitCost: "",
  unitPrice: "",
};

const initialValues: ConsignmentFormValues = {
  supplierId: "",
  items: [initialRow],
};

function validate(values: ConsignmentFormValues) {
  const errors: Record<string, string> = {};

  if (!values.supplierId) {
    errors.supplierId = "Supplier wajib dipilih.";
  }

  if (values.items.length === 0) {
    errors.items = "Minimal harus ada satu item konsinyasi.";
  }

  const selectedProducts = new Set<string>();
  values.items.forEach((item, index) => {
    if (!item.productId) {
      errors[`items.${index}.productId`] = "Produk wajib dipilih.";
    } else if (selectedProducts.has(item.productId)) {
      errors[`items.${index}.productId`] = "Produk tidak boleh duplikat.";
    } else {
      selectedProducts.add(item.productId);
    }

    if (!item.qty || Number(item.qty) <= 0) {
      errors[`items.${index}.qty`] = "Qty harus lebih dari 0.";
    } else if (Number(item.qty) > 99999999.99) {
      errors[`items.${index}.qty`] = "Qty tidak boleh melebihi 99.999.999,99.";
    } else if (item.qty.includes(".")) {
      const decimals = item.qty.split(".")[1];
      if (decimals && decimals.length > 2) {
        errors[`items.${index}.qty`] = "Qty maksimal 2 digit desimal.";
      }
    }

    if (!item.unitCost || Number(item.unitCost) <= 0) {
      errors[`items.${index}.unitCost`] = "Unit cost harus lebih dari 0.";
    } else if (Number(item.unitCost) > 99999999999.99) {
      errors[`items.${index}.unitCost`] = "Unit cost tidak boleh melebihi 99.999.999.999,99.";
    } else if (item.unitCost.includes(".")) {
      const decimals = item.unitCost.split(".")[1];
      if (decimals && decimals.length > 2) {
        errors[`items.${index}.unitCost`] = "Unit cost maksimal 2 digit desimal.";
      }
    }

    if (!item.unitPrice || Number(item.unitPrice) <= 0) {
      errors[`items.${index}.unitPrice`] = "Unit price harus lebih dari 0.";
    } else if (Number(item.unitPrice) > 99999999999.99) {
      errors[`items.${index}.unitPrice`] = "Unit price tidak boleh melebihi 99.999.999.999,99.";
    } else if (item.unitPrice.includes(".")) {
      const decimals = item.unitPrice.split(".")[1];
      if (decimals && decimals.length > 2) {
        errors[`items.${index}.unitPrice`] = "Unit price maksimal 2 digit desimal.";
      }
    }

    if (item.unitCost && item.unitPrice && Number(item.unitPrice) < Number(item.unitCost)) {
      errors[`items.${index}.unitPrice`] = "Harga jual tidak boleh kurang dari bagi hasil.";
    }
  });

  return errors;
}

export default function ConsignmentCreatePage() {
  const navigate = useNavigate();
  const { ownerMode, activeOutlets, effectiveOutletId, selectedOutletId, setSelectedOutletId } =
    useProcurementOutletScope();
  const [values, setValues] = useState<ConsignmentFormValues>(initialValues);
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadLookups() {
      if (!effectiveOutletId) {
        setSuppliers([]);
        setProducts([]);
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
        setProducts(productsResult.filter((product) => product.isConsignment));
      } catch (requestError) {
        setSubmitError(getErrorMessage(requestError, "Gagal memuat lookup konsinyasi."));
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

  const totalEstimation = useMemo(
    () =>
      values.items.reduce(
        (total, item) => total + Number(item.qty || 0) * Number(item.unitCost || 0),
        0,
      ),
    [values.items],
  );

  function updateValue<Key extends keyof ConsignmentFormValues>(key: Key, value: ConsignmentFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateItem(index: number, key: keyof ConsignmentFormRow, value: string) {
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);
    setSubmitError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!effectiveOutletId) {
      setSubmitError("Pilih outlet konsinyasi terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createConsignment({
        supplierId: values.supplierId,
        outletId: effectiveOutletId,
        items: values.items.map((item) => ({
          productId: item.productId,
          qty: Number(item.qty),
          unitCost: Number(item.unitCost),
          unitPrice: Number(item.unitPrice),
        })),
      });

      navigate(`/consignments/${result.id}`, {
        replace: true,
        state: { successMessage: `Tanda terima ${result.consignmentNumber} berhasil dibuat.` },
      });
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError, "Gagal membuat tanda terima konsinyasi."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Buat Tanda Terima Konsinyasi"
      description="Catat barang titipan supplier per outlet aktif sebelum diterima menjadi stok konsinyasi."
    >
      <InlineAlert tone="error" message={submitError} />

      <FormCard
        title="Konteks outlet konsinyasi"
        description="Owner dapat mengganti outlet konsinyasi aktif. Admin dan Keuangan mengikuti outlet pada akun."
      >
        <ProcurementOutletSelector
          ownerMode={ownerMode}
          value={selectedOutletId}
          onChange={setSelectedOutletId}
          outlets={activeOutlets}
        />
      </FormCard>

      {isLoading ? (
        <AppLoader label="Memuat lookup konsinyasi..." />
      ) : shouldShowOutletPrompt ? (
        <PagePlaceholder
          title="Pilih outlet konsinyasi terlebih dahulu"
          description="Owner perlu menentukan outlet aktif sebelum membuat tanda terima konsinyasi."
          status="Outlet required"
        />
      ) : (
        <FormCard
          title="Form tanda terima konsinyasi"
          description="Tentukan supplier lalu masukkan produk titipan beserta qty, unit cost, dan unit price."
        >
          <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
            <label className="block max-w-lg">
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Item konsinyasi</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Produk aktif dari outlet ini bisa dipakai untuk barang titipan supplier.
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
                  const estimatedCost = Number(item.qty || 0) * Number(item.unitCost || 0);
                  return (
                    <div key={`${index}-${item.productId}`} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                      <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
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
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Unit price</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(event) => updateItem(index, "unitPrice", event.target.value)}
                            className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                          />
                          <FieldErrorText message={errors[`items.${index}.unitPrice`]} />
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
                        <span>Produk terpilih: {item.productId ? productNameById.get(item.productId) : "-"}</span>
                        <span>
                          Estimasi nilai titipan:{" "}
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(estimatedCost)}
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-gray-300 px-5 py-4 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">
              Total estimasi HPP konsinyasi:{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(totalEstimation)}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/consignments")}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan tanda terima"}
              </button>
            </div>
          </form>
        </FormCard>
      )}
    </ProtectedPageShell>
  );
}

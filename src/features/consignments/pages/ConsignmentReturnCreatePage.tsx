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
import { createConsignmentReturn } from "../api/consignmentsApi";
import type { ConsignmentReturnFormRow, ConsignmentReturnFormValues } from "../types/consignment";

const initialRow: ConsignmentReturnFormRow = {
  productId: "",
  qty: "1",
};

const initialValues: ConsignmentReturnFormValues = {
  supplierId: "",
  items: [initialRow],
};

function validate(values: ConsignmentReturnFormValues) {
  const errors: Record<string, string> = {};

  if (!values.supplierId) {
    errors.supplierId = "Supplier wajib dipilih.";
  }

  if (values.items.length === 0) {
    errors.items = "Minimal harus ada satu item retur.";
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
  });

  return errors;
}

export default function ConsignmentReturnCreatePage() {
  const navigate = useNavigate();
  const { ownerMode, activeOutlets, effectiveOutletId, selectedOutletId, setSelectedOutletId } =
    useProcurementOutletScope();
  const [values, setValues] = useState<ConsignmentReturnFormValues>(initialValues);
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
        setProducts(productsResult);
      } catch (requestError) {
        setSubmitError(getErrorMessage(requestError, "Gagal memuat lookup retur konsinyasi."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadLookups();
  }, [effectiveOutletId]);

  const shouldShowOutletPrompt = ownerMode && !effectiveOutletId;

  // Filter only consignment products for return outwards
  const consignmentProducts = useMemo(
    () => products.filter((p) => p.isConsignment),
    [products],
  );

  function updateValue<Key extends keyof ConsignmentReturnFormValues>(key: Key, value: ConsignmentReturnFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateItem(index: number, key: keyof ConsignmentReturnFormRow, value: string) {
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
      setSubmitError("Pilih outlet terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createConsignmentReturn({
        supplierId: values.supplierId,
        outletId: effectiveOutletId,
        items: values.items.map((item) => ({
          productId: item.productId,
          qty: Number(item.qty),
        })),
      });

      navigate(`/consignments/returns/${result.id}`, {
        replace: true,
        state: { successMessage: `Dokumen retur ${result.returnNumber} berhasil dibuat.` },
      });
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError, "Gagal membuat retur konsinyasi."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Buat Retur Konsinyasi"
      description="Catat pengembalian atau penarikan barang titipan konsinyasi kembali ke supplier."
    >
      <InlineAlert tone="error" message={submitError} />

      <FormCard
        title="Konteks outlet retur"
        description="Owner dapat mengganti outlet aktif. Admin dan Keuangan mengikuti outlet pada akun."
      >
        <ProcurementOutletSelector
          ownerMode={ownerMode}
          value={selectedOutletId}
          onChange={setSelectedOutletId}
          outlets={activeOutlets}
        />
      </FormCard>

      {isLoading ? (
        <AppLoader label="Memuat lookup..." />
      ) : shouldShowOutletPrompt ? (
        <PagePlaceholder
          title="Pilih outlet terlebih dahulu"
          description="Owner perlu menentukan outlet aktif sebelum membuat retur konsinyasi."
          status="Outlet required"
        />
      ) : (
        <FormCard
          title="Form retur konsinyasi"
          description="Tentukan supplier lalu masukkan produk konsinyasi beserta qty yang dikembalikan."
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
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">Item retur</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Hanya produk bertipe konsinyasi aktif di outlet ini yang dapat diretur.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addRow}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                >
                  Tambah baris
                </button>
              </div>

              <div className="space-y-3">
                {values.items.map((row, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="flex-1">
                      <select
                        value={row.productId}
                        onChange={(e) => updateItem(index, "productId", e.target.value)}
                        className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      >
                        <option value="">Pilih produk konsinyasi</option>
                        {consignmentProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.sku} · {p.name}
                          </option>
                        ))}
                      </select>
                      <FieldErrorText message={errors[`items.${index}.productId`]} />
                    </div>

                    <div className="w-32">
                      <input
                        type="number"
                        step="any"
                        placeholder="Qty"
                        value={row.qty}
                        onChange={(e) => updateItem(index, "qty", e.target.value)}
                        className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                      <FieldErrorText message={errors[`items.${index}.qty`]} />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="mt-2 text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
                      disabled={values.items.length === 1}
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-900">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Draft"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/consignments/returns")}
                className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
              >
                Batal
              </button>
            </div>
          </form>
        </FormCard>
      )}
    </ProtectedPageShell>
  );
}

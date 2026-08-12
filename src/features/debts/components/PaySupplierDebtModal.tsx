import { useEffect, useState } from "react";
import { FieldErrorText } from "../../../components/forms";
import { InlineAlert } from "../../../components/ui";
import { Modal } from "../../../components/ui/modal";
import { formatCurrency } from "../../procurement/utils/formatters";
import type { SupplierDebtDto, SupplierPaymentFormValues } from "../types/debt";

type PaySupplierDebtModalProps = {
  open: boolean;
  debt: SupplierDebtDto | null;
  isSubmitting: boolean;
  submitError: string | null;
  onClose: () => void;
  onSubmit: (values: SupplierPaymentFormValues) => Promise<void>;
};

const initialValues: SupplierPaymentFormValues = {
  amount: "",
  paymentMethod: "Transfer Bank",
  referenceNumber: "",
};

export default function PaySupplierDebtModal({
  open,
  debt,
  isSubmitting,
  submitError,
  onClose,
  onSubmit,
}: PaySupplierDebtModalProps) {
  const [values, setValues] = useState<SupplierPaymentFormValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof SupplierPaymentFormValues, string>>>({});

  useEffect(() => {
    if (!open || !debt) {
      setValues(initialValues);
      setErrors({});
      return;
    }

    const maxPayable = debt.maxPayableAmount !== undefined ? debt.maxPayableAmount : debt.remainingAmount;
    setValues({
      amount: maxPayable > 0 ? String(maxPayable) : "",
      paymentMethod: "Transfer Bank",
      referenceNumber: "",
    });
    setErrors({});
  }, [debt, open]);

  function handleChange(key: keyof SupplierPaymentFormValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    const nextErrors: Partial<Record<keyof SupplierPaymentFormValues, string>> = {};

    if (!values.amount || Number(values.amount) <= 0) {
      nextErrors.amount = "Nominal pembayaran harus lebih dari 0.";
    } else if (debt) {
      const maxPayable = debt.maxPayableAmount !== undefined ? debt.maxPayableAmount : debt.remainingAmount;
      if (Number(values.amount) > maxPayable) {
        nextErrors.amount = `Nominal pembayaran tidak boleh melebihi batas pembayaran barang laku (${formatCurrency(maxPayable)}).`;
      }
    } else if (Number(values.amount) > 99999999999.99) {
      nextErrors.amount = "Nominal pembayaran tidak boleh melebihi 99.999.999.999,99.";
    } else if (values.amount.includes(".")) {
      const decimals = values.amount.split(".")[1];
      if (decimals && decimals.length > 2) {
        nextErrors.amount = "Nominal pembayaran maksimal 2 digit desimal.";
      }
    }

    if (!values.paymentMethod.trim()) {
      nextErrors.paymentMethod = "Metode pembayaran wajib diisi.";
    } else if (values.paymentMethod.trim().length > 30) {
      nextErrors.paymentMethod = "Metode pembayaran maksimal 30 karakter.";
    }

    if (values.referenceNumber.trim()) {
      if (values.referenceNumber.trim().length > 100) {
        nextErrors.referenceNumber = "Reference number maksimal 100 karakter.";
      } else if (!/^[a-zA-Z0-9\-\.\/]+$/.test(values.referenceNumber.trim())) {
        nextErrors.referenceNumber = "Reference number hanya boleh mengandung huruf, angka, strip, titik, dan garis miring.";
      }
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit(values);
  }

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-2xl p-6 sm:p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Bayar utang supplier</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Catat pembayaran untuk purchase order supplier yang masih memiliki sisa tagihan.
          </p>
        </div>

        <InlineAlert tone="error" message={submitError} />

        {debt ? (
          <>
            <div className="grid gap-4 rounded-2xl border border-gray-200 p-4 text-sm dark:border-gray-800 md:grid-cols-2">
              <div>
                <p className="text-gray-500">Supplier</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{debt.supplierName}</p>
              </div>
              <div>
                <p className="text-gray-500">No. PO</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{debt.poNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Total utang</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{formatCurrency(debt.amount)}</p>
              </div>
              <div>
                <p className="text-gray-500">Sisa utang</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{formatCurrency(debt.remainingAmount)}</p>
              </div>
              {debt.soldAmount !== undefined && (
                <div>
                  <p className="text-gray-500">Total barang laku</p>
                  <p className="mt-1 font-medium text-gray-900 dark:text-white">{formatCurrency(debt.soldAmount)}</p>
                </div>
              )}
              {debt.maxPayableAmount !== undefined && (
                <div>
                  <p className="text-gray-500">Maksimum pembayaran saat ini</p>
                  <p className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(debt.maxPayableAmount)}</p>
                </div>
              )}
            </div>

            <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Nominal pembayaran</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={values.amount}
                  onChange={(event) => handleChange("amount", event.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
                <FieldErrorText message={errors.amount} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Metode pembayaran</span>
                <input
                  value={values.paymentMethod}
                  onChange={(event) => handleChange("paymentMethod", event.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
                <FieldErrorText message={errors.paymentMethod} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Reference number</span>
                <input
                  value={values.referenceNumber}
                  onChange={(event) => handleChange("referenceNumber", event.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
                <FieldErrorText message={errors.referenceNumber} />
              </label>

              <div className="flex items-center justify-end gap-3">
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
                  {isSubmitting ? "Menyimpan..." : "Simpan pembayaran"}
                </button>
              </div>
            </form>
          </>
        ) : null}
      </div>
    </Modal>
  );
}

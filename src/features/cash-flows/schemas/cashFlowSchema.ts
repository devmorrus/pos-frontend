import type { CashFlowFormValues } from "../types/cashFlow";

export type CashFlowFieldErrors = Partial<Record<keyof CashFlowFormValues, string>>;

export function validateCashFlowForm(values: CashFlowFormValues) {
  const errors: CashFlowFieldErrors = {};

  if (!values.trxDate) {
    errors.trxDate = "Tanggal transaksi wajib diisi.";
  }

  if (!values.fromChartOfAccountId) {
    errors.fromChartOfAccountId = "Akun asal wajib dipilih.";
  }

  if (!values.toChartOfAccountId) {
    errors.toChartOfAccountId = "Akun tujuan wajib dipilih.";
  } else if (values.toChartOfAccountId === values.fromChartOfAccountId) {
    errors.toChartOfAccountId = "Akun asal dan tujuan tidak boleh sama.";
  }

  if (!values.amount.trim()) {
    errors.amount = "Nominal transaksi wajib diisi.";
  } else {
    const parsedAmount = Number(values.amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      errors.amount = "Nominal transaksi harus lebih besar dari 0.";
    }
  }

  if (values.note.trim().length > 500) {
    errors.note = "Catatan maksimal 500 karakter.";
  }

  return errors;
}

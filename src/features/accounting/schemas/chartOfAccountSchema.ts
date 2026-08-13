import type { ChartOfAccountFormValues } from "../types/chartOfAccount";

export type ChartOfAccountFieldErrors = Partial<Record<keyof ChartOfAccountFormValues, string>>;

const validTypes = new Set(["asset", "liability", "equity", "revenue", "cogs", "expense"]);

export function validateChartOfAccountForm(values: ChartOfAccountFormValues) {
  const errors: ChartOfAccountFieldErrors = {};

  if (!values.accountCode.trim()) {
    errors.accountCode = "Kode akun wajib diisi.";
  } else if (values.accountCode.trim().length > 30) {
    errors.accountCode = "Kode akun maksimal 30 karakter.";
  }

  if (!values.accountName.trim()) {
    errors.accountName = "Nama akun wajib diisi.";
  } else if (values.accountName.trim().length > 150) {
    errors.accountName = "Nama akun maksimal 150 karakter.";
  }

  if (!values.accountType || !validTypes.has(values.accountType)) {
    errors.accountType = "Tipe akun wajib dipilih.";
  }

  if (values.scope === "outlet" && !values.outletId) {
    errors.outletId = "Outlet wajib dipilih untuk akun khusus outlet.";
  }

  return errors;
}

import { useEffect, useMemo, useState } from "react";
import { FieldErrorText } from "../../../components/forms";
import InlineAlert from "../../../components/ui/InlineAlert";
import { Modal } from "../../../components/ui/modal";
import { DocsIcon } from "../../../icons";
import type { OutletDto } from "../../outlets/types/outlet";
import {
  validateChartOfAccountForm,
  type ChartOfAccountFieldErrors,
} from "../schemas/chartOfAccountSchema";
import type {
  ChartOfAccountDto,
  ChartOfAccountFormValues,
  ChartOfAccountScope,
  ChartOfAccountType,
} from "../types/chartOfAccount";

type ChartOfAccountFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  account?: ChartOfAccountDto | null;
  accounts: ChartOfAccountDto[];
  outlets: OutletDto[];
  isSubmitting: boolean;
  submitError?: string | null;
  onClose: () => void;
  onSubmit: (values: ChartOfAccountFormValues) => Promise<void>;
};

const inputClassName = "h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white";

const accountTypeOptions: Array<{ value: ChartOfAccountType; label: string }> = [
  { value: "asset", label: "Asset" },
  { value: "liability", label: "Liability" },
  { value: "equity", label: "Equity" },
  { value: "revenue", label: "Revenue" },
  { value: "cogs", label: "COGS" },
  { value: "expense", label: "Expense" },
];

const initialValues: ChartOfAccountFormValues = {
  accountCode: "",
  accountName: "",
  accountType: "",
  scope: "business",
  outletId: "",
  parentAccountId: "",
  isCashBank: false,
  isActive: true,
};

export default function ChartOfAccountFormModal({
  open,
  mode,
  account,
  accounts,
  outlets,
  isSubmitting,
  submitError,
  onClose,
  onSubmit,
}: ChartOfAccountFormModalProps) {
  const [values, setValues] = useState<ChartOfAccountFormValues>(initialValues);
  const [errors, setErrors] = useState<ChartOfAccountFieldErrors>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(
      account
        ? {
            accountCode: account.accountCode,
            accountName: account.accountName,
            accountType: account.accountType,
            scope: account.outletId ? "outlet" : "business",
            outletId: account.outletId ?? "",
            parentAccountId: account.parentAccountId ?? "",
            isCashBank: account.isCashBank,
            isActive: account.isActive,
          }
        : initialValues,
    );
    setErrors({});
  }, [account, open]);

  useEffect(() => {
    if (values.accountType !== "asset" && values.isCashBank) {
      setValues((current) => ({ ...current, isCashBank: false }));
    }
  }, [values.accountType, values.isCashBank]);

  const activeOutlets = useMemo(
    () => outlets.filter((outlet) => outlet.isActive).sort((left, right) => left.name.localeCompare(right.name, "id-ID")),
    [outlets],
  );

  const parentOptions = useMemo(() => {
    if (!values.accountType) {
      return [];
    }

    const selectedOutletId = values.scope === "outlet" ? values.outletId : "";

    return accounts
      .filter((candidate) => candidate.id !== account?.id)
      .filter((candidate) => candidate.accountType === values.accountType)
      .filter((candidate) => {
        if (selectedOutletId) {
          return !candidate.outletId || candidate.outletId === selectedOutletId;
        }

        return !candidate.outletId;
      })
      .sort((left, right) => left.accountCode.localeCompare(right.accountCode, "id-ID"))
      .map((candidate) => ({
        value: candidate.id,
        label: `${candidate.accountCode} - ${candidate.accountName}${candidate.outletName ? ` (${candidate.outletName})` : " (Business)"}`,
      }));
  }, [account?.id, accounts, values.accountType, values.outletId, values.scope]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateChartOfAccountForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit(values);
  }

  function updateScope(scope: ChartOfAccountScope) {
    setValues((current) => ({
      ...current,
      scope,
      outletId: scope === "business" ? "" : current.outletId,
      parentAccountId: "",
    }));
  }

  return (
    <Modal isOpen={open} onClose={onClose} className="m-4 max-h-[90dvh] max-w-3xl overflow-y-auto border border-gray-200 p-6 dark:border-[#293b58] sm:p-8">
      <div className="space-y-6">
        <div className="space-y-2 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-5 pr-12 dark:border-[#293b58] dark:from-[#172554] dark:to-[#111b2c]">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white"><DocsIcon className="h-6 w-6" aria-hidden="true" /></div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">MorrusPOS Finance</p>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {mode === "create" ? "Tambah akun" : "Edit akun"}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Kelola master akun untuk pemasukan, pengeluaran, dan laporan keuangan.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <InlineAlert tone="error" message={submitError} />

          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Identitas akun</h4>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Kode akun <span className="text-error-500">*</span>
              </span>
              <input
                placeholder="Contoh: 1001"
                value={values.accountCode}
                onChange={(event) => setValues((current) => ({ ...current, accountCode: event.target.value }))}
                className={inputClassName}
              />
              <FieldErrorText message={errors.accountCode} />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Nama akun <span className="text-error-500">*</span>
              </span>
              <input
                placeholder="Contoh: Kas Tunai Outlet"
                value={values.accountName}
                onChange={(event) => setValues((current) => ({ ...current, accountName: event.target.value }))}
                className={inputClassName}
              />
              <FieldErrorText message={errors.accountName} />
            </label>
          </div>

          <h4 className="border-t border-gray-200 pt-5 text-sm font-semibold text-gray-900 dark:border-gray-800 dark:text-white">Klasifikasi & cakupan</h4>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Tipe akun <span className="text-error-500">*</span>
              </span>
              <select
                value={values.accountType}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    accountType: event.target.value as ChartOfAccountType,
                    parentAccountId: "",
                  }))
                }
                className={inputClassName}
              >
                <option value="">Pilih tipe akun</option>
                {accountTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldErrorText message={errors.accountType} />
            </label>

            <div className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Cakupan akun</span>
              <div role="group" aria-label="Cakupan akun" className="grid grid-cols-2 gap-3">
                {(["business", "outlet"] as const).map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    aria-pressed={values.scope === scope}
                    onClick={() => updateScope(scope)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                      values.scope === scope
                        ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200"
                        : "border-gray-200 text-gray-700 dark:border-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {scope === "business" ? "Seluruh bisnis" : "Khusus outlet"}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">Gunakan akun bisnis untuk kebutuhan umum atau outlet untuk cabang tertentu.</p>
            </div>
          </div>

          {values.scope === "outlet" && (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Outlet <span className="text-error-500">*</span>
              </span>
              <select
                value={values.outletId}
                onChange={(event) =>
                  setValues((current) => ({ ...current, outletId: event.target.value, parentAccountId: "" }))
                }
                className={inputClassName}
              >
                <option value="">Pilih outlet</option>
                {activeOutlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </select>
              <FieldErrorText message={errors.outletId} />
            </label>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Akun induk</span>
            <select
              value={values.parentAccountId}
              onChange={(event) => setValues((current) => ({ ...current, parentAccountId: event.target.value }))}
              className={inputClassName}
              disabled={!values.accountType}
            >
              <option value="">Tanpa akun induk</option>
              {parentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
              Pilihan induk mengikuti tipe dan cakupan akun. Kosongkan jika akun ini berada pada tingkat teratas.
            </p>
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-[#293b58] dark:bg-[#111b2c]">
              <input
                type="checkbox"
                checked={values.isCashBank}
                disabled={values.accountType !== "asset"}
                onChange={(event) => setValues((current) => ({ ...current, isCashBank: event.target.checked }))}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <span>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">Akun kas/bank</span>
                <span className="block text-xs text-gray-400">
                  Hanya tersedia untuk akun bertipe asset.
                </span>
              </span>
            </label>

            {mode === "edit" ? (
              <label className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-[#293b58] dark:bg-[#111b2c]">
                <input
                  type="checkbox"
                  checked={values.isActive}
                  onChange={(event) => setValues((current) => ({ ...current, isActive: event.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">Akun aktif</span>
                  <span className="block text-xs text-gray-400">
                    Akun nonaktif tidak dipakai untuk transaksi baru.
                  </span>
                </span>
              </label>
            ) : (
              <div className="rounded-2xl border border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                Akun baru otomatis aktif setelah dibuat.
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center rounded-xl border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-11 items-center rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Menyimpan..." : mode === "create" ? "Simpan akun" : "Perbarui akun"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { FieldErrorText, FormCard } from "../../../components/forms";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { getChartOfAccounts } from "../../accounting/api/chartOfAccountsApi";
import type { ChartOfAccountDto } from "../../accounting/types/chartOfAccount";
import { useAuth } from "../../auth/hooks/useAuth";
import { getOutlets } from "../../outlets/api/outletsApi";
import type { OutletDto } from "../../outlets/types/outlet";
import {
  createBusinessIncome,
  createBusinessOutcome,
  uploadCashFlowAttachment,
} from "../api/cashFlowsApi";
import { validateCashFlowForm, type CashFlowFieldErrors } from "../schemas/cashFlowSchema";
import type { CashFlowFormValues } from "../types/cashFlow";
import { DollarLineIcon, InfoIcon } from "../../../icons";

const inputClassName = "h-12 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white dark:[color-scheme:dark]";

type CashFlowFormPageProps = {
  trxType: "in" | "out";
};

const initialValues: CashFlowFormValues = {
  trxDate: new Date().toISOString().slice(0, 10),
  outletId: "",
  fromChartOfAccountId: "",
  toChartOfAccountId: "",
  amount: "",
  note: "",
  attachmentUrl: "",
};

export default function CashFlowFormPage({ trxType }: CashFlowFormPageProps) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [values, setValues] = useState<CashFlowFormValues>(initialValues);
  const [accounts, setAccounts] = useState<ChartOfAccountDto[]>([]);
  const [outlets, setOutlets] = useState<OutletDto[]>([]);
  const [errors, setErrors] = useState<CashFlowFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const isPrivilegedRole =
    session?.role === "Owner" || session?.role === "Admin" || session?.role === "Keuangan";

  useEffect(() => {
    async function loadLookups() {
      setIsLoading(true);
      setError(null);

      try {
        const [accountsResult, outletsResult] = await Promise.all([getChartOfAccounts(), getOutlets()]);
        setAccounts(accountsResult.filter((account) => account.isActive));
        setOutlets(outletsResult.filter((outlet) => outlet.isActive));

        if (!isPrivilegedRole && session?.outletId) {
          setValues((current) => ({ ...current, outletId: session.outletId ?? "" }));
        }
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat lookup transaksi cash flow."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadLookups();
  }, [isPrivilegedRole, session?.outletId]);

  const selectedOutletId = isPrivilegedRole ? values.outletId : session?.outletId ?? "";

  const availableAccounts = useMemo(() => {
    return accounts.filter((account) => {
      if (!selectedOutletId) {
        return !account.outletId;
      }

      return !account.outletId || account.outletId === selectedOutletId;
    });
  }, [accounts, selectedOutletId]);

  const accountOptions = useMemo(
    () =>
      [...availableAccounts].sort((left, right) => left.accountCode.localeCompare(right.accountCode, "id-ID")),
    [availableAccounts],
  );

  const selectedFromAccount = accountOptions.find((account) => account.id === values.fromChartOfAccountId) ?? null;
  const selectedToAccount = accountOptions.find((account) => account.id === values.toChartOfAccountId) ?? null;

  useEffect(() => {
    if (selectedFromAccount && selectedFromAccount.outletId && selectedFromAccount.outletId !== selectedOutletId) {
      setValues((current) => ({ ...current, fromChartOfAccountId: "" }));
    }
    if (selectedToAccount && selectedToAccount.outletId && selectedToAccount.outletId !== selectedOutletId) {
      setValues((current) => ({ ...current, toChartOfAccountId: "" }));
    }
  }, [selectedFromAccount, selectedOutletId, selectedToAccount]);

  function updateValue<Key extends keyof CashFlowFormValues>(key: Key, value: CashFlowFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleAttachmentChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadCashFlowAttachment(files[0]);
      setValues((current) => ({ ...current, attachmentUrl: result.url }));
    } catch (requestError) {
      setUploadError(getErrorMessage(requestError, "Gagal mengunggah lampiran transaksi."));
      setValues((current) => ({ ...current, attachmentUrl: "" }));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateCashFlowForm(values);
    setErrors(nextErrors);
    setError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (isUploading) {
      setError("Tunggu proses upload lampiran selesai terlebih dahulu.");
      return;
    }

    if (uploadError) {
      setError("Perbaiki lampiran terlebih dahulu sebelum menyimpan transaksi.");
      return;
    }

    if (!selectedFromAccount?.isCashBank && !selectedToAccount?.isCashBank) {
      setError("Salah satu akun harus bertipe kas/bank.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        trxDate: new Date(values.trxDate).toISOString(),
        outletId: selectedOutletId || null,
        fromChartOfAccountId: values.fromChartOfAccountId,
        toChartOfAccountId: values.toChartOfAccountId,
        amount: Number(values.amount),
        note: values.note.trim() || null,
        attachmentUrl: values.attachmentUrl || null,
      };

      const result =
        trxType === "in"
          ? await createBusinessIncome(payload)
          : await createBusinessOutcome(payload);

      navigate(
        trxType === "in" ? `/income-businesses/${result.id}` : `/outcome-businesses/${result.id}`,
        {
          replace: true,
          state: {
            successMessage:
              trxType === "in"
                ? `Pemasukan ${result.trxNumber} berhasil dibuat.`
                : `Pengeluaran ${result.trxNumber} berhasil dibuat.`,
          },
        },
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal menyimpan transaksi cash flow."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedPageShell
      title={trxType === "in" ? "Tambah Pendapatan Toko" : "Tambah Pengeluaran Toko"}
      description={
        trxType === "in"
          ? "Catat pemasukan toko manual. Pastikan salah satu akun yang dipilih adalah akun kas atau bank."
          : "Catat pengeluaran toko manual. Pastikan salah satu akun yang dipilih adalah akun kas atau bank."
      }
    >
      <InlineAlert tone="error" message={error} />
      <InlineAlert tone="error" message={uploadError} />

      <section className="flex items-start gap-4 rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6 dark:border-[#293b58] dark:from-[#172554] dark:to-[#111b2c]">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white"><DollarLineIcon className="h-6 w-6" aria-hidden="true" /></div>
        <div><p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">{trxType === "in" ? "Pencatatan pemasukan" : "Pencatatan pengeluaran"}</p><h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">Lengkapi transaksi, pastikan akun sesuai</h2><p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">Tentukan tanggal dan outlet, pilih akun asal serta tujuan, lalu lengkapi nominal dan bukti pendukung.</p></div>
      </section>

      {isLoading ? (
        <AppLoader label="Memuat form cash flow..." />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormCard
            title="1. Informasi transaksi"
            description="Tentukan tanggal pencatatan dan cakupan transaksi bisnis atau outlet."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Tanggal transaksi <span className="text-error-500">*</span>
                </span>
                <input
                  type="date"
                  value={values.trxDate}
                  onChange={(event) => updateValue("trxDate", event.target.value)}
                  className={inputClassName}
                />
                <FieldErrorText message={errors.trxDate} />
              </label>

              {isPrivilegedRole ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Outlet</span>
                  <select
                    value={values.outletId}
                    onChange={(event) => updateValue("outletId", event.target.value)}
                    className={inputClassName}
                  >
                    <option value="">Seluruh bisnis</option>
                    {outlets.map((outlet) => (
                      <option key={outlet.id} value={outlet.id}>
                        {outlet.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          </FormCard>

          <FormCard title="2. Aliran akun" description="Pilih akun asal dan tujuan yang berbeda. Salah satu akun wajib merupakan akun kas atau bank.">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Akun asal <span className="text-error-500">*</span>
                </span>
                <select
                  value={values.fromChartOfAccountId}
                  onChange={(event) => updateValue("fromChartOfAccountId", event.target.value)}
                  className={inputClassName}
                >
                  <option value="">Pilih akun asal</option>
                  {accountOptions.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountCode} - {account.accountName}{account.isCashBank ? " (Kas/Bank)" : ""}
                    </option>
                  ))}
                </select>
                <FieldErrorText message={errors.fromChartOfAccountId} />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Akun tujuan <span className="text-error-500">*</span>
                </span>
                <select
                  value={values.toChartOfAccountId}
                  onChange={(event) => updateValue("toChartOfAccountId", event.target.value)}
                  className={inputClassName}
                >
                  <option value="">Pilih akun tujuan</option>
                  {accountOptions.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountCode} - {account.accountName}{account.isCashBank ? " (Kas/Bank)" : ""}
                    </option>
                  ))}
                </select>
                <FieldErrorText message={errors.toChartOfAccountId} />
              </label>
            </div>
          </FormCard>

          <FormCard title="3. Nominal & bukti transaksi" description="Isi nilai transaksi dan tambahkan lampiran atau catatan bila diperlukan.">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Nominal (Rp) <span className="text-error-500">*</span>
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Contoh: 150000"
                  value={values.amount}
                  onChange={(event) => updateValue("amount", event.target.value)}
                  className={inputClassName}
                />
                <FieldErrorText message={errors.amount} />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Lampiran <span className="font-normal text-gray-500 dark:text-gray-400">(opsional)</span>
                </span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(event) => void handleAttachmentChange(event)}
                  className="block w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-semibold file:text-brand-700 focus-visible:outline-brand-500 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-gray-300 dark:file:bg-brand-500/10 dark:file:text-brand-300"
                />
                <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  Maksimal 2MB. Format JPG, JPEG, PNG, atau PDF.
                </p>
                <p role="status" className="mt-1 text-xs font-medium text-brand-600 dark:text-brand-300">{isUploading ? "Sedang mengunggah lampiran..." : values.attachmentUrl ? "Lampiran berhasil diunggah." : ""}</p>
              </label>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Catatan</span>
              <textarea
                rows={4}
                placeholder="Tambahkan keterangan atau keperluan transaksi..."
                value={values.note}
                onChange={(event) => updateValue("note", event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white"
              />
              <FieldErrorText message={errors.note} />
            </label>
          </FormCard>

          <div className="flex items-start gap-3 rounded-2xl border border-warning-200 bg-warning-50 p-5 dark:border-warning-500/20 dark:bg-warning-500/10">
            <InfoIcon className="h-5 w-5 shrink-0 text-warning-600 dark:text-warning-400" aria-hidden="true" />
            <div><p className="text-sm font-semibold text-gray-900 dark:text-white">Periksa sebelum menyimpan</p><p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">Transaksi langsung berstatus final dan otomatis diposting ke jurnal, bukan disimpan sebagai draft. Pastikan tanggal, outlet, akun, dan nominal sudah benar.</p></div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(trxType === "in" ? "/income-businesses" : "/outcome-businesses")}
              className="inline-flex min-h-12 items-center rounded-xl border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="inline-flex min-h-12 items-center rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isUploading
                ? "Mengunggah..."
                : isSubmitting
                  ? "Menyimpan..."
                  : trxType === "in"
                    ? "Simpan pemasukan"
                    : "Simpan pengeluaran"}
            </button>
          </div>
        </form>
      )}
    </ProtectedPageShell>
  );
}

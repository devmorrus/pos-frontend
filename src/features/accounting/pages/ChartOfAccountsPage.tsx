import { useEffect, useMemo, useState } from "react";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, ConfirmDialog, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { getOutlets } from "../../outlets/api/outletsApi";
import type { OutletDto } from "../../outlets/types/outlet";
import {
  createChartOfAccount,
  getChartOfAccounts,
  updateChartOfAccount,
  updateChartOfAccountStatus,
} from "../api/chartOfAccountsApi";
import ChartOfAccountFormModal from "../components/ChartOfAccountFormModal";
import type {
  ChartOfAccountDto,
  ChartOfAccountFormValues,
  ChartOfAccountScope,
  ChartOfAccountType,
} from "../types/chartOfAccount";

function formatDate(value: string) {
  return new Date(value).toLocaleString("id-ID");
}

function getAccountTypeLabel(type: ChartOfAccountType) {
  switch (type) {
    case "asset":
      return "Asset";
    case "liability":
      return "Liability";
    case "equity":
      return "Equity";
    case "revenue":
      return "Revenue";
    case "cogs":
      return "COGS";
    case "expense":
      return "Expense";
    default:
      return type;
  }
}

type ModalState =
  | { open: false; mode: "create"; account: null }
  | { open: true; mode: "create"; account: null }
  | { open: true; mode: "edit"; account: ChartOfAccountDto };

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<ChartOfAccountDto[]>([]);
  const [outlets, setOutlets] = useState<OutletDto[]>([]);
  const [modalState, setModalState] = useState<ModalState>({
    open: false,
    mode: "create",
    account: null,
  });
  const [statusTarget, setStatusTarget] = useState<ChartOfAccountDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState<ChartOfAccountType | "all">("all");
  const [scopeFilter, setScopeFilter] = useState<ChartOfAccountScope | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");

  async function loadData() {
    setIsLoading(true);
    setError(null);

    try {
      const [accountsResult, outletsResult] = await Promise.all([getChartOfAccounts(), getOutlets()]);
      setAccounts(accountsResult);
      setOutlets(outletsResult);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat data chart of accounts."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredAccounts = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return [...accounts]
      .filter((account) => {
        if (!normalizedKeyword) {
          return true;
        }

        return (
          account.accountCode.toLowerCase().includes(normalizedKeyword)
          || account.accountName.toLowerCase().includes(normalizedKeyword)
        );
      })
      .filter((account) => (typeFilter === "all" ? true : account.accountType === typeFilter))
      .filter((account) => {
        if (scopeFilter === "all") {
          return true;
        }

        return scopeFilter === "business" ? !account.outletId : Boolean(account.outletId);
      })
      .filter((account) => {
        if (statusFilter === "all") {
          return true;
        }

        return statusFilter === "active" ? account.isActive : !account.isActive;
      })
      .sort((left, right) => left.accountCode.localeCompare(right.accountCode, "id-ID"));
  }, [accounts, keyword, scopeFilter, statusFilter, typeFilter]);

  function openCreateModal() {
    setSubmitError(null);
    setModalState({
      open: true,
      mode: "create",
      account: null,
    });
  }

  function openEditModal(account: ChartOfAccountDto) {
    setSubmitError(null);
    setModalState({
      open: true,
      mode: "edit",
      account,
    });
  }

  function closeModal() {
    if (isSubmitting) {
      return;
    }

    setModalState({
      open: false,
      mode: "create",
      account: null,
    });
    setSubmitError(null);
  }

  async function handleSubmit(values: ChartOfAccountFormValues) {
    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      accountCode: values.accountCode.trim(),
      accountName: values.accountName.trim(),
      accountType: values.accountType as ChartOfAccountType,
      isCashBank: values.accountType === "asset" ? values.isCashBank : false,
      outletId: values.scope === "outlet" ? values.outletId || null : null,
      parentAccountId: values.parentAccountId || null,
    };

    try {
      if (modalState.mode === "create") {
        await createChartOfAccount(payload);
        setSuccessMessage(`Akun ${payload.accountCode} berhasil dibuat.`);
      } else {
        await updateChartOfAccount(modalState.account.id, {
          ...payload,
          isActive: values.isActive,
        });
        setSuccessMessage(`Akun ${payload.accountCode} berhasil diperbarui.`);
      }

      closeModal();
      await loadData();
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError, "Gagal menyimpan akun."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusConfirm() {
    if (!statusTarget) {
      return;
    }

    setIsUpdatingStatus(true);
    setError(null);

    try {
      await updateChartOfAccountStatus(statusTarget.id, { isActive: !statusTarget.isActive });
      setSuccessMessage(
        statusTarget.isActive
          ? `Akun ${statusTarget.accountCode} berhasil dinonaktifkan.`
          : `Akun ${statusTarget.accountCode} berhasil diaktifkan kembali.`,
      );
      setStatusTarget(null);
      await loadData();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memperbarui status akun."));
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Chart of Accounts"
      description="Kelola master akun untuk pemasukan, pengeluaran, dan laporan keuangan MorrusPOS."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      <AppTableShell
        title="Daftar akun"
        description="Akun global business dan akun khusus outlet dikelola dalam satu pusat keuangan."
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Tambah akun
          </button>
        }
      >
        <div className="grid gap-3 border-b border-gray-200 p-4 dark:border-gray-800 md:grid-cols-4">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Cari kode atau nama akun"
            className="h-11 rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
          />

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as ChartOfAccountType | "all")}
            className="h-11 rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
          >
            <option value="all">Semua tipe</option>
            <option value="asset">Asset</option>
            <option value="liability">Liability</option>
            <option value="equity">Equity</option>
            <option value="revenue">Revenue</option>
            <option value="cogs">COGS</option>
            <option value="expense">Expense</option>
          </select>

          <select
            value={scopeFilter}
            onChange={(event) => setScopeFilter(event.target.value as ChartOfAccountScope | "all")}
            className="h-11 rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
          >
            <option value="all">Semua scope</option>
            <option value="business">Business</option>
            <option value="outlet">Outlet</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}
            className="h-11 rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
          >
            <option value="active">Akun aktif</option>
            <option value="inactive">Akun nonaktif</option>
            <option value="all">Semua status</option>
          </select>
        </div>

        {isLoading ? (
          <AppLoader label="Memuat chart of accounts..." />
        ) : filteredAccounts.length === 0 ? (
          <div className="p-6">
            <PagePlaceholder
              title="Belum ada akun"
              description="Tambahkan akun pertama untuk memulai master keuangan MorrusPOS."
              status="Empty"
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                {["Kode Akun", "Nama Akun", "Tipe", "Scope", "Parent", "Cash/Bank", "Status", "Diupdate", "Aksi"].map((column) => (
                  <th
                    key={column}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="align-top">
                  <td className="px-6 py-4 font-mono text-sm font-semibold text-gray-900 dark:text-white">
                    {account.accountCode}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{account.accountName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      {getAccountTypeLabel(account.accountType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {account.outletName ? `Outlet: ${account.outletName}` : "Business"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {account.parentAccountName ?? "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        account.isCashBank
                          ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {account.isCashBank ? "Kas/Bank" : "Bukan Kas/Bank"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        account.isActive
                          ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300"
                          : "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300"
                      }`}
                    >
                      {account.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(account.updatedAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(account)}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusTarget(account)}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                          account.isActive
                            ? "border-warning-200 text-warning-700 dark:border-warning-500/20 dark:text-warning-300"
                            : "border-success-200 text-success-700 dark:border-success-500/20 dark:text-success-300"
                        }`}
                      >
                        {account.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AppTableShell>

      <ChartOfAccountFormModal
        open={modalState.open}
        mode={modalState.mode}
        account={modalState.account}
        accounts={accounts}
        outlets={outlets}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(statusTarget)}
        title={statusTarget?.isActive ? "Nonaktifkan akun" : "Aktifkan akun"}
        description={
          statusTarget?.isActive
            ? `Akun ${statusTarget?.accountCode ?? ""} akan dinonaktifkan dan tidak bisa dipakai untuk transaksi baru.`
            : `Akun ${statusTarget?.accountCode ?? ""} akan diaktifkan kembali dan bisa dipakai lagi.`
        }
        confirmLabel={statusTarget?.isActive ? "Nonaktifkan akun" : "Aktifkan akun"}
        isBusy={isUpdatingStatus}
        onCancel={() => setStatusTarget(null)}
        onConfirm={() => void handleStatusConfirm()}
      />
    </ProtectedPageShell>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import AppTableShell from "../../../components/tables/AppTableShell";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { getChartOfAccounts } from "../../accounting/api/chartOfAccountsApi";
import type { ChartOfAccountDto } from "../../accounting/types/chartOfAccount";
import { useAuth } from "../../auth/hooks/useAuth";
import { getOutlets } from "../../outlets/api/outletsApi";
import type { OutletDto } from "../../outlets/types/outlet";
import { getCashFlows } from "../api/cashFlowsApi";
import CashFlowFilters from "../components/CashFlowFilters";
import CashFlowStatusSummary from "../components/CashFlowStatusSummary";
import type { CashFlowFilterValues, CashFlowListItemDto } from "../types/cashFlow";
import { formatCashFlowCurrency, formatCashFlowDate, formatCashFlowDateTime } from "../utils/presentation";
import { ArrowDownIcon, PlusIcon } from "../../../icons";

export default function IncomeBusinessesPage() {
  const { session } = useAuth();
  const [items, setItems] = useState<CashFlowListItemDto[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccountDto[]>([]);
  const [outlets, setOutlets] = useState<OutletDto[]>([]);
  const [filters, setFilters] = useState<CashFlowFilterValues>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const canFilterOutlet =
    session?.role === "Owner" || session?.role === "Admin" || session?.role === "Keuangan";

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const [cashFlowsResult, accountsResult, outletsResult] = await Promise.all([
          getCashFlows("in", filters),
          getChartOfAccounts(),
          getOutlets(),
        ]);
        setItems(cashFlowsResult);
        setAccounts(accountsResult.filter((account) => account.isActive));
        setOutlets(outletsResult.filter((outlet) => outlet.isActive));
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat daftar pendapatan toko."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [filters]);

  const summary = useMemo(
    () => ({
      totalAmount: items.reduce((sum, item) => sum + item.amount, 0),
      totalDocuments: items.filter((item) => Boolean(item.attachmentUrl)).length,
      totalTransactions: items.length,
    }),
    [items],
  );

  return (
    <ProtectedPageShell
      title="Pendapatan Toko"
      description="Catat dan pantau transaksi pemasukan toko manual yang langsung diposting ke jurnal keuangan."
    >
      <InlineAlert tone="error" message={error} />

      <section className="rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white p-6 dark:border-[#293b58] dark:from-[#172554] dark:via-[#1e1b4b] dark:to-[#111b2c] sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-success-500 text-white shadow-lg shadow-success-500/20"><ArrowDownIcon className="h-7 w-7" aria-hidden="true" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Pencatatan pemasukan</p><h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Pendapatan tercatat, arus kas terpantau</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">Pantau pemasukan manual bisnis dan outlet, telusuri aliran antar akun, dan simpan bukti transaksi dalam satu tempat.</p></div>
        </div>
      </section>

      <CashFlowStatusSummary
        totalAmount={summary.totalAmount}
        totalTransactions={summary.totalTransactions}
        totalDocuments={summary.totalDocuments}
      />

      <AppTableShell
        title="Daftar pemasukan"
        description="Filter transaksi pemasukan per tanggal, outlet, akun, dan catatan."
        actions={
          <Link
            to="/income-businesses/create"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" />Tambah pemasukan
          </Link>
        }
      >
        <CashFlowFilters
          filters={filters}
          onChange={setFilters}
          accounts={accounts}
          outlets={outlets}
          canFilterOutlet={canFilterOutlet}
        />

        {isLoading ? (
          <div className="p-6">
            <AppLoader label="Memuat daftar pemasukan..." />
          </div>
        ) : items.length === 0 ? (
          <div className="p-6">
            <PagePlaceholder
              title="Belum ada pemasukan"
              description="Belum ada transaksi pendapatan toko pada filter yang dipilih."
              status="Data kosong"
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-[#111b2c]">
              <tr>
                {["No. Transaksi", "Tanggal", "Akun", "Outlet", "Nominal", "Dibuat", "Aksi"].map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {items.map((item) => (
                <tr key={item.id} className="transition hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                    {item.trxNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {formatCashFlowDate(item.trxDate)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                    <div>{item.fromChartOfAccountCode} - {item.fromChartOfAccountName}</div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Ke {item.toChartOfAccountCode} - {item.toChartOfAccountName}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {item.outletName ?? "Seluruh bisnis"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-success-700 dark:text-success-400">
                    {formatCashFlowCurrency(item.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    <div>{item.createdByName}</div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formatCashFlowDateTime(item.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      to={`/income-businesses/${item.id}`}
                      aria-label={`Lihat pemasukan ${item.trxNumber}`}
                      className="inline-flex min-h-10 items-center rounded-xl border border-brand-200 bg-brand-50 px-3 font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AppTableShell>
    </ProtectedPageShell>
  );
}

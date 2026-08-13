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
            className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Tambah pemasukan
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
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                {["No. Transaksi", "Tanggal", "Akun", "Outlet", "Nominal", "Dibuat", "Aksi"].map((column) => (
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
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                    {item.trxNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {formatCashFlowDate(item.trxDate)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                    <div>{item.fromChartOfAccountCode} - {item.fromChartOfAccountName}</div>
                    <div className="text-xs text-gray-500">ke {item.toChartOfAccountCode} - {item.toChartOfAccountName}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {item.outletName ?? "Business"}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {formatCashFlowCurrency(item.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    <div>{item.createdByName}</div>
                    <div className="text-xs text-gray-500">{formatCashFlowDateTime(item.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      to={`/income-businesses/${item.id}`}
                      className="font-semibold text-brand-600 hover:text-brand-500"
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

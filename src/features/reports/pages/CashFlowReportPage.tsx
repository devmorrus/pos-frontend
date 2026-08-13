import { useEffect, useMemo, useState } from "react";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { getChartOfAccounts } from "../../accounting/api/chartOfAccountsApi";
import type { ChartOfAccountDto } from "../../accounting/types/chartOfAccount";
import { useAuth } from "../../auth/hooks/useAuth";
import { getOutlets } from "../../outlets/api/outletsApi";
import type { OutletDto } from "../../outlets/types/outlet";
import { useOutlet } from "../../outlets/hooks/useOutlet";
import { exportCashFlowExcel, getCashFlowReport } from "../api/reportsApi";
import type { AccountingCashFlowReportDto } from "../types/reports";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID");
}

function getTodayInput() {
  return new Date().toISOString().slice(0, 10);
}

function getStartOfMonthInput() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(value)}</p>
    </div>
  );
}

export default function CashFlowReportPage() {
  const { session } = useAuth();
  const { selectedOutletId } = useOutlet();
  const [report, setReport] = useState<AccountingCashFlowReportDto | null>(null);
  const [outlets, setOutlets] = useState<OutletDto[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccountDto[]>([]);
  const [dateFrom, setDateFrom] = useState(getStartOfMonthInput);
  const [dateTo, setDateTo] = useState(getTodayInput);
  const [keyword, setKeyword] = useState("");
  const [outletId, setOutletId] = useState<string>("");
  const [chartOfAccountId, setChartOfAccountId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPrivileged = session?.role === "Owner" || session?.role === "Admin" || session?.role === "Keuangan";
  const effectiveOutletId = isPrivileged ? outletId || selectedOutletId || "" : session?.outletId ?? "";

  useEffect(() => {
    async function loadLookups() {
      try {
        const [outletsResult, accountsResult] = await Promise.all([getOutlets(), getChartOfAccounts()]);
        setOutlets(outletsResult.filter((currentOutlet) => currentOutlet.isActive));
        setAccounts(accountsResult.filter((account) => account.isActive && account.accountType === "asset" && account.isCashBank));
      } catch {
        setOutlets([]);
        setAccounts([]);
      }
    }

    void loadLookups();
  }, []);

  useEffect(() => {
    if (!isPrivileged) {
      setOutletId(session?.outletId ?? "");
    }
  }, [isPrivileged, session?.outletId]);

  useEffect(() => {
    async function loadReport() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getCashFlowReport({
          dateFrom,
          dateTo,
          outletId: effectiveOutletId || undefined,
          chartOfAccountId: chartOfAccountId || undefined,
          keyword: keyword.trim() || undefined,
        });
        setReport(result);
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat laporan arus kas."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadReport();
  }, [chartOfAccountId, dateFrom, dateTo, effectiveOutletId, keyword]);

  const summary = useMemo(() => report?.summary ?? null, [report]);

  async function handleExport() {
    setIsExporting(true);
    setError(null);

    try {
      const file = await exportCashFlowExcel({
        dateFrom,
        dateTo,
        outletId: effectiveOutletId || undefined,
        chartOfAccountId: chartOfAccountId || undefined,
        keyword: keyword.trim() || undefined,
      });

      const url = window.URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      const formattedStart = dateFrom.replace(/-/g, "");
      const formattedEnd = dateTo.replace(/-/g, "");
      link.setAttribute("download", `Laporan_Arus_Kas_${formattedStart}_${formattedEnd}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal mengekspor laporan arus kas."));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Laporan Arus Kas"
      description="Laporan pergerakan kas dan bank berdasarkan jurnal akuntansi yang sudah diposting."
    >
      <InlineAlert tone="error" message={error} />

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid flex-1 gap-4 lg:grid-cols-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Tanggal mulai</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="h-11 w-full rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Tanggal akhir</span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="h-11 w-full rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            />
          </label>

          {isPrivileged ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Outlet</span>
              <select
                value={outletId}
                onChange={(event) => setOutletId(event.target.value)}
                className="h-11 w-full rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              >
                <option value="">Semua outlet</option>
                {outlets.map((currentOutlet) => (
                  <option key={currentOutlet.id} value={currentOutlet.id}>
                    {currentOutlet.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Akun kas/bank</span>
            <select
              value={chartOfAccountId}
              onChange={(event) => setChartOfAccountId(event.target.value)}
              className="h-11 w-full rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            >
              <option value="">Semua akun kas/bank</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.accountCode} - {account.accountName}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Keyword</span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Cari nomor, catatan, atau akun"
              className="h-11 w-full rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            />
          </label>
        </div>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={isLoading || isExporting}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-brand-500 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting ? "Mengekspor..." : "Ekspor Excel"}
          </button>
        </div>
      </section>

      {isLoading ? (
        <AppLoader label="Memuat laporan arus kas..." />
      ) : !report || !summary ? (
        <PagePlaceholder
          title="Belum ada mutasi kas"
          description="Belum ada jurnal kas dan bank pada periode yang dipilih."
          status="Belum ada data"
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Kas Awal" value={summary.openingBalance} />
            <SummaryCard label="Kas Masuk" value={summary.cashIn} />
            <SummaryCard label="Kas Keluar" value={summary.cashOut} />
            <SummaryCard label="Kas Akhir" value={summary.closingBalance} />
          </div>

          <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mutasi kas dan bank</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Debit merepresentasikan kas masuk dan kredit merepresentasikan kas keluar.
              </p>
            </div>

            {report.lines.length === 0 ? (
              <div className="p-6">
                <PagePlaceholder
                  title="Belum ada mutasi kas pada periode ini"
                  description="Coba ubah filter tanggal, outlet, atau akun kas/bank untuk melihat data."
                  status="Data kosong"
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-950">
                    <tr>
                      {["Tanggal", "No. Transaksi", "Outlet", "Akun", "Catatan", "Debit", "Kredit", "Mutasi", "Saldo Berjalan"].map((column) => (
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
                    {report.lines.map((line) => (
                      <tr key={line.accountTransactionId}>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{formatDate(line.trxDate)}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{line.trxNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{line.outletName ?? "Business"}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                          {line.accountCode} - {line.accountName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{line.note || "-"}</td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900 dark:text-white">
                          {line.debitAmount > 0 ? formatCurrency(line.debitAmount) : "-"}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900 dark:text-white">
                          {line.creditAmount > 0 ? formatCurrency(line.creditAmount) : "-"}
                        </td>
                        <td className={`px-6 py-4 text-right text-sm font-medium ${line.movementAmount >= 0 ? "text-success-700 dark:text-success-300" : "text-error-600 dark:text-error-300"}`}>
                          {formatCurrency(line.movementAmount)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(line.runningBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </ProtectedPageShell>
  );
}

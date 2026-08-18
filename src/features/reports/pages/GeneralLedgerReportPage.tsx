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
import { exportGeneralLedgerExcel, getGeneralLedgerReport } from "../api/reportsApi";
import type { GeneralLedgerReportDto } from "../types/reports";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
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

export default function GeneralLedgerReportPage() {
  const { session } = useAuth();
  const { selectedOutletId } = useOutlet();
  const [report, setReport] = useState<GeneralLedgerReportDto | null>(null);
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
        setAccounts(accountsResult.filter((account) => account.isActive));
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
        const result = await getGeneralLedgerReport({
          dateFrom,
          dateTo,
          outletId: effectiveOutletId || undefined,
          chartOfAccountId: chartOfAccountId || undefined,
          keyword: keyword.trim() || undefined,
        });
        setReport(result);
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat laporan buku besar."));
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
      const file = await exportGeneralLedgerExcel({
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
      link.setAttribute("download", `Laporan_Buku_Besar_${formattedStart}_${formattedEnd}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal mengekspor laporan buku besar."));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Buku Besar (General Ledger)"
      description="Laporan rincian mutasi seluruh jurnal akuntansi per-akun secara transparan."
    >
      <InlineAlert tone="error" message={error} />

      <section className="mb-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tanggal Mulai</span>
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={dateFrom}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-3 pr-10 text-sm text-gray-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <div className="absolute right-3 flex items-center pointer-events-none text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tanggal Akhir</span>
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={dateTo}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-3 pr-10 text-sm text-gray-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <div className="absolute right-3 flex items-center pointer-events-none text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                </div>
              </div>
            </div>

            {isPrivileged ? (
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Outlet</span>
                <select
                  value={outletId}
                  onChange={(event) => setOutletId(event.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pilih Akun COA</span>
              <select
                value={chartOfAccountId}
                onChange={(event) => setChartOfAccountId(event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Semua Akun</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.accountCode} - {account.accountName} ({account.accountType})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Keyword</span>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Cari no. jurnal, catatan, kode..."
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={isLoading || isExporting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {isExporting ? "Mengekspor..." : "Ekspor Excel"}
          </button>
        </div>
      </section>

      {isLoading ? (
        <AppLoader label="Memuat laporan buku besar..." />
      ) : !report || !summary ? (
        <PagePlaceholder
          title="Belum ada transaksi"
          description="Belum ada jurnal akuntansi yang masuk pada kriteria filter yang dipilih."
          status="Belum ada data"
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Saldo Awal" value={summary.openingBalance} />
            <SummaryCard label="Total Debit" value={summary.totalDebit} />
            <SummaryCard label="Total Kredit" value={summary.totalCredit} />
            <SummaryCard label="Saldo Akhir" value={summary.closingBalance} />
          </div>

          <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Jurnal Buku Besar</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Menampilkan rincian debit/kredit per-jurnal transaksi secara transparan dan berurutan.
              </p>
            </div>

            {report.lines.length === 0 ? (
              <div className="p-6">
                <PagePlaceholder
                  title="Tidak ada baris transaksi ditemukan"
                  description="Coba ubah tanggal, atau pilih akun COA lain untuk menampilkan data."
                  status="Data kosong"
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-950">
                    <tr>
                      {["Tanggal", "No. Jurnal", "Tipe Ref", "Outlet", "Akun", "Keterangan", "Debit", "Kredit", "Saldo Berjalan"].map((column) => (
                        <th
                          key={column}
                          className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {report.lines.map((line) => (
                      <tr key={line.accountTransactionId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="px-6 py-4 text-xs font-medium text-gray-700 dark:text-gray-300">{formatDate(line.trxDate)}</td>
                        <td className="px-6 py-4 text-xs font-bold text-violet-600 dark:text-violet-400">{line.trxNumber}</td>
                        <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            {line.referenceType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-700 dark:text-gray-300">{line.outletName ?? "Business"}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-gray-900 dark:text-white">
                          {line.accountCode} - {line.accountName}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-700 dark:text-gray-300 max-w-xs truncate" title={line.note ?? ""}>
                          {line.note || "—"}
                        </td>
                        <td className="px-6 py-4 text-right text-xs font-bold text-gray-900 dark:text-white">
                          {line.debitAmount > 0 ? formatCurrency(line.debitAmount) : "—"}
                        </td>
                        <td className="px-6 py-4 text-right text-xs font-bold text-gray-900 dark:text-white">
                          {line.creditAmount > 0 ? formatCurrency(line.creditAmount) : "—"}
                        </td>
                        <td className="px-6 py-4 text-right text-xs font-bold text-gray-900 dark:text-white">
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

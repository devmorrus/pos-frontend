import { useEffect, useMemo, useState } from "react";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { getOutlets } from "../../outlets/api/outletsApi";
import type { OutletDto } from "../../outlets/types/outlet";
import { useOutlet } from "../../outlets/hooks/useOutlet";
import { useAuth } from "../../auth/hooks/useAuth";
import { exportProfitLossExcel, getProfitLossReport } from "../api/reportsApi";
import type { AccountingProfitLossReportDto, AccountingProfitLossSectionDto } from "../types/reports";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getTodayInput() {
  return new Date().toISOString().slice(0, 10);
}

function getStartOfMonthInput() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "negative" | "positive";
}) {
  const toneClass =
    tone === "positive"
      ? "text-success-700 dark:text-success-300"
      : tone === "negative"
        ? "text-error-600 dark:text-error-300"
        : "text-gray-900 dark:text-white";

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${toneClass}`}>{formatCurrency(value)}</p>
    </div>
  );
}

function ProfitLossSection({
  title,
  section,
}: {
  title: string;
  section: AccountingProfitLossSectionDto;
}) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Akun {section.accountType} yang memiliki transaksi pada periode terpilih.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Total</p>
          <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
            {formatCurrency(section.total)}
          </p>
        </div>
      </div>

      {section.accounts.length === 0 ? (
        <div className="px-6 py-8 text-sm text-gray-500 dark:text-gray-400">Belum ada data akun pada section ini.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                {["Kode Akun", "Nama Akun", "Nominal"].map((column) => (
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
              {section.accounts.map((account) => (
                <tr key={account.chartOfAccountId}>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{account.accountCode}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{account.accountName}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(account.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function ProfitLossReportPage() {
  const { session } = useAuth();
  const { selectedOutletId } = useOutlet();
  const [report, setReport] = useState<AccountingProfitLossReportDto | null>(null);
  const [outlets, setOutlets] = useState<OutletDto[]>([]);
  const [dateFrom, setDateFrom] = useState(getStartOfMonthInput);
  const [dateTo, setDateTo] = useState(getTodayInput);
  const [keyword, setKeyword] = useState("");
  const [outletId, setOutletId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPrivileged = session?.role === "Owner" || session?.role === "Admin" || session?.role === "Keuangan";
  const effectiveOutletId = isPrivileged ? outletId || selectedOutletId || "" : session?.outletId ?? "";

  useEffect(() => {
    async function loadOutlets() {
      if (!isPrivileged) {
        return;
      }

      try {
        const result = await getOutlets();
        setOutlets(result.filter((currentOutlet) => currentOutlet.isActive));
      } catch {
        setOutlets([]);
      }
    }

    void loadOutlets();
  }, [isPrivileged]);

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
        const result = await getProfitLossReport({
          dateFrom,
          dateTo,
          outletId: effectiveOutletId || undefined,
          keyword: keyword.trim() || undefined,
        });
        setReport(result);
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat laporan laba rugi."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadReport();
  }, [dateFrom, dateTo, effectiveOutletId, keyword]);

  const summary = useMemo(() => report?.summary ?? null, [report]);

  async function handleExport() {
    setIsExporting(true);
    setError(null);

    try {
      const file = await exportProfitLossExcel({
        dateFrom,
        dateTo,
        outletId: effectiveOutletId || undefined,
        keyword: keyword.trim() || undefined,
      });

      const url = window.URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      const formattedStart = dateFrom.replace(/-/g, "");
      const formattedEnd = dateTo.replace(/-/g, "");
      link.setAttribute("download", `Laporan_Laba_Rugi_Akuntansi_${formattedStart}_${formattedEnd}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal mengekspor laporan laba rugi."));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Laporan Laba Rugi"
      description="Ringkasan pendapatan, HPP, dan biaya berdasarkan jurnal akuntansi pada periode terpilih."
    >
      <InlineAlert tone="error" message={error} />

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid flex-1 gap-4 lg:grid-cols-4">
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
        <AppLoader label="Memuat laporan laba rugi..." />
      ) : !report || !summary ? (
        <PagePlaceholder
          title="Data laporan belum tersedia"
          description="Belum ada data jurnal untuk menampilkan laba rugi pada periode ini."
          status="Belum ada data"
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <SummaryCard label="Pendapatan" value={summary.revenueTotal} />
            <SummaryCard label="HPP" value={summary.cogsTotal} tone="negative" />
            <SummaryCard label="Laba Kotor" value={summary.grossProfit} tone={summary.grossProfit >= 0 ? "positive" : "negative"} />
            <SummaryCard label="Biaya" value={summary.expenseTotal} tone="negative" />
            <SummaryCard label="Laba Bersih" value={summary.netProfit} tone={summary.netProfit >= 0 ? "positive" : "negative"} />
          </div>

          <ProfitLossSection title="Pendapatan" section={report.revenue} />
          <ProfitLossSection title="Harga Pokok Penjualan" section={report.cogs} />
          <ProfitLossSection title="Biaya Operasional" section={report.expense} />

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-5 dark:bg-gray-950">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Rumus Laba Kotor</p>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                  Pendapatan - HPP = <span className="font-semibold">{formatCurrency(summary.grossProfit)}</span>
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-5 dark:bg-gray-950">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Rumus Laba Bersih</p>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                  Laba Kotor - Biaya = <span className="font-semibold">{formatCurrency(summary.netProfit)}</span>
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </ProtectedPageShell>
  );
}

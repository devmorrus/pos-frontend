import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { useOutlet } from "../../outlets/hooks/useOutlet";
import { getProfitLossReport, exportProfitLossExcel } from "../api/reportsApi";
import type { ProfitLossReportDto } from "../types/reports";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, InlineAlert } from "../../../components/ui";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ProfitLossReportPage() {
  const { session } = useAuth();
  const { selectedOutletId } = useOutlet();
  
  const userRole = session?.role;
  const isPrivileged = userRole === "Owner" || userRole === "Admin" || userRole === "Keuangan";
  const effectiveOutletId = isPrivileged ? selectedOutletId : session?.outletId ?? null;


  const [report, setReport] = useState<ProfitLossReportDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date Range State
  const [rangeType, setRangeType] = useState<"today" | "7days" | "30days" | "month" | "custom">("month");
  
  const defaultDates = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1); // default to start of month
    return {
      start: start.toISOString().split("T")[0],
      end: today.toISOString().split("T")[0],
    };
  }, []);

  const [customDates, setCustomDates] = useState(defaultDates);

  const activeDates = useMemo(() => {
    const today = new Date();
    let start = new Date();
    switch (rangeType) {
      case "today":
        start = today;
        break;
      case "7days":
        start.setDate(today.getDate() - 7);
        break;
      case "30days":
        start.setDate(today.getDate() - 30);
        break;
      case "month":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "custom":
        return customDates;
    }
    return {
      start: start.toISOString().split("T")[0],
      end: today.toISOString().split("T")[0],
    };
  }, [rangeType, customDates, defaultDates]);



  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getProfitLossReport({
        outletId: effectiveOutletId || undefined,
        startDate: activeDates.start,
        endDate: activeDates.end,
      });
      setReport(result);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Gagal memuat laporan laba rugi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [effectiveOutletId, activeDates]);

  const handleExportExcel = async () => {
    setIsExporting(true);
    setError(null);
    try {
      await exportProfitLossExcel({
        outletId: effectiveOutletId || undefined,
        startDate: activeDates.start,
        endDate: activeDates.end,
      });
    } catch (requestError: any) {
      setError("Gagal mengekspor data ke Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ProtectedPageShell
      title="Laporan Laba Rugi"
      description="Rincian pendapatan operasional bisnis dikurangi harga pokok penjualan (HPP) untuk menganalisis profitabilitas bersih."
    >
      <InlineAlert tone="error" message={error} />

      {/* FILTER & ACTIONS PANEL */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-3">

          {/* Preset Dates */}
          <div className="inline-flex rounded-2xl bg-gray-100 p-1 dark:bg-gray-950">
            {(["today", "7days", "30days", "month", "custom"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setRangeType(type)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  rangeType === type
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                {type === "today" && "Hari Ini"}
                {type === "7days" && "7 Hari"}
                {type === "30days" && "30 Hari"}
                {type === "month" && "Bulan Ini"}
                {type === "custom" && "Kustom"}
              </button>
            ))}
          </div>

          {rangeType === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customDates.start}
                onChange={(e) =>
                  setCustomDates((c) => ({ ...c, start: e.target.value }))
                }
                className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
              <span className="text-gray-400">s/d</span>
              <input
                type="date"
                value={customDates.end}
                onChange={(e) =>
                  setCustomDates((c) => ({ ...c, end: e.target.value }))
                }
                className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Action Button: Export */}
        <button
          type="button"
          onClick={handleExportExcel}
          disabled={isLoading || isExporting || !report}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting ? "Mengekspor..." : "Ekspor Excel (CSV)"}
        </button>
      </div>

      {isLoading ? (
        <AppLoader label="Menghitung laporan laba rugi..." />
      ) : (
        report && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            {/* STRUCTURED P&L SHEET */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-6 text-base font-semibold uppercase tracking-wider text-gray-400">
                Pernyataan Laba Rugi
              </h3>

              <div className="space-y-4">
                {/* 1. Pendapatan */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-150 pb-2 dark:border-gray-800">
                    Pendapatan Penjualan
                  </h4>
                  <div className="mt-3 space-y-2.5 text-sm">
                    <div className="flex justify-between text-gray-600 dark:text-gray-300">
                      <span>Penjualan Kotor (Subtotal)</span>
                      <span>{formatCurrency(report.grossRevenue)}</span>
                    </div>
                    <div className="flex justify-between text-error-600">
                      <span>Diskon Penjualan</span>
                      <span>-{formatCurrency(report.totalDiscount)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-300">
                      <span>Pajak Penjualan</span>
                      <span>{formatCurrency(report.totalTax)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-gray-900 dark:text-white border-t border-dashed border-gray-200 pt-2.5 dark:border-gray-800">
                      <span>Total Pendapatan Bersih</span>
                      <span>{formatCurrency(report.netRevenue)}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Harga Pokok Penjualan */}
                <div className="pt-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white border-b border-gray-150 pb-2 dark:border-gray-800">
                    Harga Pokok Penjualan (HPP)
                  </h4>
                  <div className="mt-3 space-y-2.5 text-sm">
                    <div className="flex justify-between text-gray-600 dark:text-gray-300">
                      <span>Total Biaya HPP (Harga Modal)</span>
                      <span className="text-error-600">-{formatCurrency(report.costOfGoodsSold)}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Laba Kotor Akhir */}
                <div className="rounded-2xl bg-gray-50 dark:bg-gray-950 p-4 border border-gray-100 dark:border-gray-800 mt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Laba Kotor (*Gross Profit*)
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">Pendapatan Bersih - HPP</p>
                    </div>
                    <span className="text-xl font-bold text-success-700 dark:text-success-300">
                      {formatCurrency(report.grossProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* BREAKDOWN BY CATEGORIES */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-6 text-base font-semibold uppercase tracking-wider text-gray-400">
                Rincian Margin per Kategori
              </h3>

              {report.categoryBreakdown.length === 0 ? (
                <p className="py-20 text-center text-sm text-gray-500">Tidak ada rincian kategori.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead>
                      <tr>
                        {["Kategori", "Pendapatan", "HPP", "Laba Kotor", "Margin"].map((c) => (
                          <th
                            key={c}
                            className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
                          >
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                      {report.categoryBreakdown.map((cat) => {
                        const margin = cat.revenue > 0 ? (cat.grossProfit / cat.revenue) * 100 : 0;
                        return (
                          <tr key={cat.categoryId}>
                            <td className="py-3.5 text-sm font-medium text-gray-900 dark:text-white">{cat.categoryName}</td>
                            <td className="py-3.5 text-sm text-gray-900 dark:text-white">{formatCurrency(cat.revenue)}</td>
                            <td className="py-3.5 text-sm text-error-600">-{formatCurrency(cat.costOfGoodsSold)}</td>
                            <td className="py-3.5 text-sm font-semibold text-success-700">{formatCurrency(cat.grossProfit)}</td>
                            <td className="py-3.5 text-sm font-semibold text-brand-600">{margin.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )
      )}
    </ProtectedPageShell>
  );
}

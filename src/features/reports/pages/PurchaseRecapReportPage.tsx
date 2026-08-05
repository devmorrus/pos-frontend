import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { useOutlet } from "../../outlets/hooks/useOutlet";
import { getOutlets } from "../../outlets/api/outletsApi";
import type { OutletDto } from "../../outlets/types/outlet";
import { getPurchaseRecapReport, exportPurchaseRecapExcel } from "../api/reportsApi";
import type { PurchaseRecapReportDto } from "../types/reports";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, InlineAlert } from "../../../components/ui";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PurchaseRecapReportPage() {
  const { session } = useAuth();
  const { selectedOutletId, setSelectedOutletId } = useOutlet();
  
  const userRole = session?.role;
  const isPrivileged = userRole === "Owner" || userRole === "Admin" || userRole === "Keuangan";
  const effectiveOutletId = isPrivileged ? selectedOutletId : session?.outletId ?? null;

  const [outlets, setOutlets] = useState<OutletDto[]>([]);
  const [report, setReport] = useState<PurchaseRecapReportDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date Range State
  const [rangeType, setRangeType] = useState<"today" | "7days" | "30days" | "month" | "custom">("month");
  
  const defaultDates = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
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
  }, [rangeType, customDates]);

  useEffect(() => {
    if (isPrivileged) {
      getOutlets()
        .then((res) => setOutlets(res))
        .catch(() => {});
    }
  }, [isPrivileged]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getPurchaseRecapReport({
        outletId: effectiveOutletId || undefined,
        startDate: activeDates.start,
        endDate: activeDates.end,
      });
      setReport(result);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Gagal memuat rekap pembelian.");
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
      await exportPurchaseRecapExcel({
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
      title="Laporan Rekap Pembelian"
      description="Laporan rekapitulasi nilai pembelian stok (Purchase Order) yang telah diselesaikan beserta rincian pengeluaran per produk dan supplier."
    >
      <InlineAlert tone="error" message={error} />

      {/* FILTER & ACTIONS PANEL */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-3">
          {/* Outlet Selector */}
          {isPrivileged && (
            <div className="min-w-[200px]">
              <select
                value={selectedOutletId ?? ""}
                onChange={(e) => setSelectedOutletId(e.target.value || null)}
                className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              >
                <option value="">Semua Outlet</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
          onClick={() => void handleExportExcel()}
          disabled={isLoading || isExporting || !report}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting ? "Mengekspor..." : "Ekspor Excel (CSV)"}
        </button>
      </div>

      {isLoading ? (
        <AppLoader label="Memuat rekap pembelian..." />
      ) : (
        report && (
          <div className="space-y-6 mt-6">
            {/* SUMMARY CARDS */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Total Pengeluaran Belanja
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(report.totalSpent)}
                </p>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Total Dokumen PO Selesai
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {report.totalOrdersCount}
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
              {/* PRODUCT BREAKDOWN */}
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-4 text-base font-semibold uppercase tracking-wider text-gray-400">
                  Rincian Pembelian per Produk
                </h3>

                {report.productBreakdown.length === 0 ? (
                  <p className="py-20 text-center text-sm text-gray-500">Tidak ada produk dibeli pada periode ini.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                      <thead>
                        <tr>
                          {["SKU", "Produk", "Qty Belanja", "Rata-Rata Beli", "Total Belanja"].map((c) => (
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
                        {report.productBreakdown.map((p) => (
                          <tr key={p.productId}>
                            <td className="py-3 text-sm text-gray-500 dark:text-gray-400">{p.sku}</td>
                            <td className="py-3 text-sm font-medium text-gray-900 dark:text-white">{p.productName}</td>
                            <td className="py-3 text-sm text-gray-900 dark:text-white">{p.totalQty}</td>
                            <td className="py-3 text-sm text-gray-900 dark:text-white">{formatCurrency(p.averageUnitCost)}</td>
                            <td className="py-3 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(p.totalSpent)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SUPPLIER BREAKDOWN */}
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-4 text-base font-semibold uppercase tracking-wider text-gray-400">
                  Rincian Belanja per Supplier
                </h3>

                {report.supplierBreakdown.length === 0 ? (
                  <p className="py-20 text-center text-sm text-gray-500">Tidak ada supplier yang diorder pada periode ini.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                      <thead>
                        <tr>
                          {["Supplier", "Dokumen PO", "Total Belanja"].map((c) => (
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
                        {report.supplierBreakdown.map((s) => (
                          <tr key={s.supplierId}>
                            <td className="py-3 text-sm font-medium text-gray-900 dark:text-white">{s.supplierName}</td>
                            <td className="py-3 text-sm text-gray-900 dark:text-white">{s.totalOrders}</td>
                            <td className="py-3 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(s.totalSpent)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}
    </ProtectedPageShell>
  );
}

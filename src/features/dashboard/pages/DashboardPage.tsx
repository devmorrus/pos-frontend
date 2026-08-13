import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../auth/hooks/useAuth";

import { useOutlet } from "../../outlets/hooks/useOutlet";
import { getRoleDashboardSummary } from "../api/dashboardApi";
import type { RoleDashboardDto } from "../types/dashboard";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, InlineAlert } from "../../../components/ui";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const { session } = useAuth();
  const { selectedOutletId } = useOutlet();
  
  const userRole = session?.role;
  const isPrivileged = userRole === "Owner" || userRole === "Admin" || userRole === "Keuangan";
  const effectiveOutletId = isPrivileged ? selectedOutletId : session?.outletId ?? null;


  const [roleSummary, setRoleSummary] = useState<RoleDashboardDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const summary = roleSummary?.ownerData ?? null;

  // Date Range State
  const [rangeType, setRangeType] = useState<"today" | "7days" | "30days" | "month" | "custom">("30days");
  
  const defaultDates = useMemo(() => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 30);
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
      const result = await getRoleDashboardSummary({
        outletId: effectiveOutletId || undefined,
        startDate: activeDates.start,
        endDate: activeDates.end,
      });
      setRoleSummary(result);
    } catch (requestError: any) {
      setError(requestError?.message || "Gagal memuat ringkasan dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [effectiveOutletId, activeDates]);

  // Chart 1: Sales Trend Options
  const trendOptions: ApexOptions = {
    chart: {
      type: "area",
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: ["#3C50E0"],
    stroke: { curve: "smooth", width: 3 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 95, 100],
      },
    },
    grid: {
      borderColor: "#E2E8F0",
      strokeDashArray: 5,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories: summary?.salesTrend.map((t) => new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })) ?? [],
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (val) => formatCurrency(val),
      },
    },
    dataLabels: { enabled: false },
    tooltip: {
      x: { format: "dd MMM yyyy" },
      y: { formatter: (val) => formatCurrency(val) },
    },
  };

  const trendSeries = [
    {
      name: "Penjualan",
      data: summary?.salesTrend.map((t) => t.salesAmount) ?? [],
    },
  ];

  // Chart 2: Payment Methods Options
  const paymentOptions: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#3C50E0", "#6577F3", "#8FD0EF", "#0FADCF"],
    labels: summary?.paymentMethods.map((p) => p.method.toUpperCase()) ?? [],
    legend: {
      position: "bottom",
      fontFamily: "Outfit, sans-serif",
    },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Sales",
              formatter: () => formatCurrency(summary?.totalSales ?? 0),
            },
          },
        },
      },
    },
    tooltip: {
      y: { formatter: (val) => formatCurrency(val) },
    },
  };

  const paymentSeries = summary?.paymentMethods.map((p) => Number(p.amount)) ?? [];

  // Chart 3: Sales Channels Options
  const channelOptions: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#3C50E0", "#10B981", "#F59E0B", "#EF4444"],
    labels: summary?.salesChannels.map((c) => c.channel.toUpperCase()) ?? [],
    legend: {
      position: "bottom",
      fontFamily: "Outfit, sans-serif",
    },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Sales Count",
              formatter: () => summary?.totalTransactions.toString() ?? "0",
            },
          },
        },
      },
    },
  };

  const channelSeries = summary?.salesChannels.map((c) => Number(c.amount)) ?? [];

  const renderOwnerDashboard = () => {
    if (!summary) return null;
    return (
      <div className="space-y-6">
        {/* WIDGET CARDS / KPIS */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {/* Card 1: Omzet */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
              Total Omzet
            </p>
            <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(summary.totalSales)}
            </h3>
          </div>

          {/* Card 2: Jumlah Transaksi */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
              Total Transaksi
            </p>
            <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {summary.totalTransactions.toLocaleString("id-ID")}
            </h3>
          </div>

          {/* Card 3: Rata-rata Belanja */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
              Average Order Value
            </p>
            <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(summary.averageOrderValue)}
            </h3>
          </div>

          {/* Card 4: Laba Kotor */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
              Laba Kotor
            </p>
            <h3 className="mt-2 text-2xl font-bold text-success-700 dark:text-success-300">
              {formatCurrency(summary.grossProfit)}
            </h3>
          </div>

          {/* Card 5: Margin Laba Kotor */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
              Margin Laba
            </p>
            <h3 className="mt-2 text-2xl font-bold text-brand-600 dark:text-brand-400">
              {summary.grossMargin.toFixed(1)}%
            </h3>
          </div>
        </div>

        {/* CHARTS GRID */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sales Trend Chart */}
          <div className="lg:col-span-2 rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
              Tren Grafik Penjualan
            </h3>
            <Chart options={trendOptions} series={trendSeries} type="area" height={320} />
          </div>

          {/* Payment Method Distribution */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
              Metode Pembayaran
            </h3>
            {summary.paymentMethods.length === 0 ? (
              <p className="py-20 text-center text-sm text-gray-500">Tidak ada data transaksi.</p>
            ) : (
              <Chart options={paymentOptions} series={paymentSeries} type="donut" height={320} />
            )}
          </div>
        </div>

        {/* LOWER GRID: TOP PRODUCTS & OUTLET COMPARISONS / CHANNELS */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Products Table */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
              Produk Terlaris (Top 5)
            </h3>
            {summary.topProducts.length === 0 ? (
              <p className="py-20 text-center text-sm text-gray-500">Tidak ada produk terlaris.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead>
                    <tr>
                      {["Produk", "SKU", "Qty Terjual", "Omzet"].map((c) => (
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
                    {summary.topProducts.map((p) => (
                      <tr key={p.productId}>
                        <td className="py-3.5 text-sm font-medium text-gray-900 dark:text-white">{p.productName}</td>
                        <td className="py-3.5 text-sm text-gray-500">{p.sku}</td>
                        <td className="py-3.5 text-sm font-semibold text-gray-900 dark:text-white">{p.qtySold.toLocaleString("id-ID")}</td>
                        <td className="py-3.5 text-sm font-semibold text-brand-600">{formatCurrency(p.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Outlet Comparison or Sales Channels Distribution */}
          {isPrivileged && !effectiveOutletId ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
                Perbandingan Performa Outlet
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead>
                    <tr>
                      {["Outlet", "Total Penjualan", "Total Transaksi"].map((c) => (
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
                    {summary.outletComparisons.map((o) => (
                      <tr key={o.outletId}>
                        <td className="py-3.5 text-sm font-medium text-gray-900 dark:text-white">{o.outletName}</td>
                        <td className="py-3.5 text-sm font-semibold text-success-700">{formatCurrency(o.totalSales)}</td>
                        <td className="py-3.5 text-sm text-gray-900 dark:text-white">{o.totalTransactions.toLocaleString("id-ID")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
                Saluran Penjualan (POS vs Online)
              </h3>
              {summary.salesChannels.length === 0 ? (
                <p className="py-20 text-center text-sm text-gray-500">Tidak ada data saluran penjualan.</p>
              ) : (
                <Chart options={channelOptions} series={channelSeries} type="donut" height={320} />
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderKeuanganDashboard = (data: any) => {
    const purchaseTrendOptions: ApexOptions = {
      chart: {
        type: "area",
        fontFamily: "Outfit, sans-serif",
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      colors: ["#3C50E0"],
      stroke: { curve: "smooth", width: 3 },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [0, 95, 100],
        },
      },
      grid: {
        borderColor: "#E2E8F0",
        strokeDashArray: 5,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
      },
      xaxis: {
        categories: data.purchaseTrend.map((t: any) => new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })) ?? [],
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          formatter: (val) => formatCurrency(val),
        },
      },
      dataLabels: { enabled: false },
      tooltip: {
        x: { format: "dd MMM yyyy" },
        y: { formatter: (val) => formatCurrency(val) },
      },
    };

    const purchaseTrendSeries = [
      {
        name: "Pengeluaran Pembelian",
        data: data.purchaseTrend.map((t: any) => t.salesAmount) ?? [],
      },
    ];

    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">Estimasi Kas Aktif</p>
            <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.cashOnHand)}</h3>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">Pengeluaran Pembelian</p>
            <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.totalPurchases)}</h3>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">Total Utang Supplier</p>
            <h3 className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(data.totalSupplierDebt)}</h3>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Tren Pengeluaran Pembelian</h3>
            <Chart options={purchaseTrendOptions} series={purchaseTrendSeries} type="area" height={320} />
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Utang Jatuh Tempo Terdekat</h3>
            {data.upcomingDebts.length === 0 ? (
              <p className="py-20 text-center text-sm text-gray-500">Tidak ada utang jatuh tempo.</p>
            ) : (
              <div className="space-y-4">
                {data.upcomingDebts.map((d: any) => (
                  <div key={d.supplierDebtId} className="flex flex-col justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold text-gray-950 dark:text-white">{d.supplierName}</p>
                        <p className="text-xs text-gray-500">{d.poNumber}</p>
                      </div>
                      <span className="text-sm font-bold text-red-600">{formatCurrency(d.remainingAmount)}</span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span className="text-xs text-gray-400">Jatuh Tempo:</span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{new Date(d.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Supplier Teraktif (Top 5)</h3>
          {data.topSuppliers.length === 0 ? (
            <p className="py-20 text-center text-sm text-gray-500">Tidak ada data transaksi supplier.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead>
                  <tr>
                    {["Supplier", "Total Pembelian", "Jumlah PO"].map((c) => (
                      <th key={c} className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                  {data.topSuppliers.map((s: any) => (
                    <tr key={s.supplierId}>
                      <td className="py-3.5 text-sm font-medium text-gray-900 dark:text-white">{s.supplierName}</td>
                      <td className="py-3.5 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(s.totalPurchaseAmount)}</td>
                      <td className="py-3.5 text-sm text-gray-500">{s.poCount} PO</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGudangDashboard = (data: any) => {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">Total Produk</p>
            <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{data.totalProducts}</h3>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">Kurang Stok</p>
            <h3 className={`mt-2 text-2xl font-bold ${data.lowStockAlertsCount > 0 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>{data.lowStockAlertsCount}</h3>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">PO Pending</p>
            <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{data.pendingPurchaseOrdersCount}</h3>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">Transfer Pending</p>
            <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{data.pendingStockTransfersCount}</h3>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">Konsinyasi Aktif</p>
            <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{data.activeConsignmentsCount}</h3>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Daftar Produk Menipis & Habis</h3>
          {data.lowStockProducts.length === 0 ? (
            <p className="py-20 text-center text-sm text-green-600">Seluruh stok produk aman.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead>
                  <tr>
                    {["Produk", "SKU", "Stok Sekarang", "Batas Minimal", "Status"].map((c) => (
                      <th key={c} className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                  {data.lowStockProducts.map((p: any) => (
                    <tr key={p.productId}>
                      <td className="py-3.5 text-sm font-medium text-gray-900 dark:text-white">{p.productName}</td>
                      <td className="py-3.5 text-sm text-gray-500">{p.sku}</td>
                      <td className="py-3.5 text-sm font-bold text-red-650 dark:text-red-400">{p.qtyOnHand.toLocaleString("id-ID")}</td>
                      <td className="py-3.5 text-sm text-gray-400">{p.minStockAlert.toLocaleString("id-ID")}</td>
                      <td className="py-3.5 text-sm">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.qtyOnHand <= 0 ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" : "bg-yellow-50 text-yellow-805 dark:bg-yellow-950/30 dark:text-yellow-400"}`}>
                          {p.qtyOnHand <= 0 ? "Habis" : "Menipis"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderKasirDashboard = (data: any) => {
    if (!data.activeSession) {
      return (
        <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">Sesi Kasir Belum Dibuka</h3>
          <p className="mt-2 text-sm text-gray-500">Anda harus membuka sesi kasir aktif dan mengatur modal kas awal laci terlebih dahulu untuk mulai melayani transaksi penjualan.</p>
          <div className="mt-6">
            <a href="/cashier/session" className="inline-flex h-11 items-center justify-center rounded-2xl bg-brand-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
              Buka Sesi Sekarang
            </a>
          </div>
        </div>
      );
    }

    const kasirPaymentOptions: ApexOptions = {
      chart: {
        type: "donut",
        fontFamily: "Outfit, sans-serif",
      },
      colors: ["#3C50E0", "#6577F3", "#8FD0EF", "#0FADCF"],
      labels: data.paymentMethodsThisSession.map((p: any) => p.method.toUpperCase()) ?? [],
      legend: {
        position: "bottom",
        fontFamily: "Outfit, sans-serif",
      },
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: {
            size: "70%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Sales Sesi Ini",
                formatter: () => formatCurrency(data.totalSalesThisSession),
              },
            },
          },
        },
      },
      tooltip: {
        y: { formatter: (val) => formatCurrency(val) },
      },
    };

    const kasirPaymentSeries = data.paymentMethodsThisSession.map((p: any) => Number(p.amount)) ?? [];

    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">Status Sesi</p>
            <h3 className="mt-2 text-xl font-bold text-green-600 dark:text-green-400">Terbuka / Aktif</h3>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">Kas Awal Laci</p>
            <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.openingCash)}</h3>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">Omzet Sesi Ini</p>
            <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.totalSalesThisSession)}</h3>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">Transaksi Sesi Ini</p>
            <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{data.totalTransactionsThisSession.toLocaleString("id-ID")}</h3>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Transaksi Terakhir Sesi Ini</h3>
            {data.recentTransactions.length === 0 ? (
              <p className="py-20 text-center text-sm text-gray-500">Belum ada transaksi di sesi ini.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead>
                    <tr>
                      {["No. Invoice", "Waktu", "Metode", "Total Belanja"].map((c) => (
                        <th key={c} className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                    {data.recentTransactions.map((t: any) => (
                      <tr key={t.transactionId}>
                        <td className="py-3.5 text-sm font-medium text-gray-900 dark:text-white">{t.invoiceNumber}</td>
                        <td className="py-3.5 text-sm text-gray-500">{new Date(t.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</td>
                        <td className="py-3.5 text-sm">
                          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-850 uppercase dark:bg-gray-800 dark:text-gray-300">{t.paymentMethod}</span>
                        </td>
                        <td className="py-3.5 text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(t.grandTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Metode Pembayaran Sesi Ini</h3>
            {data.paymentMethodsThisSession.length === 0 ? (
              <p className="py-20 text-center text-sm text-gray-500">Tidak ada transaksi.</p>
            ) : (
              <Chart options={kasirPaymentOptions} series={kasirPaymentSeries} type="donut" height={320} />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDashboardContent = () => {
    if (!roleSummary) return null;

    switch (userRole) {
      case "Owner":
      case "Admin":
      case "KepalaCabang":
        return renderOwnerDashboard();
      case "Keuangan":
        return roleSummary.keuanganData ? renderKeuanganDashboard(roleSummary.keuanganData) : null;
      case "Gudang":
        return roleSummary.gudangData ? renderGudangDashboard(roleSummary.gudangData) : null;
      case "Kasir":
        return roleSummary.kasirData ? renderKasirDashboard(roleSummary.kasirData) : null;
      default:
        return renderOwnerDashboard();
    }
  };

  const showFilterPanel = userRole === "Owner" || userRole === "Admin" || userRole === "Keuangan" || userRole === "KepalaCabang";

  return (
    <ProtectedPageShell
      title="Dashboard Bisnis"
      description="Pemantauan kinerja operasional, finansial, dan logistik outlet secara real-time."
    >
      <InlineAlert tone="error" message={error} />

      {/* FILTER PANEL */}
      {showFilterPanel && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 mb-6">
          <div className="flex flex-wrap items-center gap-3">


            {/* Preset Date Range Buttons */}
            <div className="inline-flex rounded-2xl bg-gray-100 p-1 dark:bg-gray-955">
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
          </div>

          {/* Custom Date Pickers */}
          {rangeType === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customDates.start}
                onChange={(e) =>
                  setCustomDates((c) => ({ ...c, start: e.target.value }))
                }
                className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-955 dark:text-white"
              />
              <span className="text-gray-400">s/d</span>
              <input
                type="date"
                value={customDates.end}
                onChange={(e) =>
                  setCustomDates((c) => ({ ...c, end: e.target.value }))
                }
                className="h-11 rounded-2xl border border-gray-200 px-3 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-955 dark:text-white"
              />
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <AppLoader label="Memuat ringkasan dashboard..." />
      ) : (
        renderDashboardContent()
      )}
    </ProtectedPageShell>
  );
}

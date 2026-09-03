import { useEffect, useMemo, useState } from "react";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { useAuth } from "../../auth/hooks/useAuth";
import { getOutlets } from "../../outlets/api/outletsApi";
import type { OutletDto } from "../../outlets/types/outlet";
import { useOutlet } from "../../outlets/hooks/useOutlet";
import { getSuppliers } from "../../suppliers/api/suppliersApi";
import type { SupplierDto } from "../../suppliers/types/supplier";
import { exportSupplierReportExcel, getSupplierReport } from "../api/reportsApi";
import type { SupplierReportDto } from "../types/reports";

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
      <p className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(value)}</p>
    </div>
  );
}

export default function SupplierReportPage() {
  const { session } = useAuth();
  const { selectedOutletId } = useOutlet();
  const [report, setReport] = useState<SupplierReportDto | null>(null);
  const [outlets, setOutlets] = useState<OutletDto[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [dateFrom, setDateFrom] = useState(getStartOfMonthInput);
  const [dateTo, setDateTo] = useState(getTodayInput);
  const [supplierId, setSupplierId] = useState<string>("");
  const [outletId, setOutletId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPrivileged = session?.role === "Owner" || session?.role === "Admin" || session?.role === "Keuangan";
  const effectiveOutletId = isPrivileged ? outletId || selectedOutletId || "" : session?.outletId ?? "";

  useEffect(() => {
    async function loadLookups() {
      try {
        const [outletsResult, suppliersResult] = await Promise.all([getOutlets(), getSuppliers()]);
        setOutlets(outletsResult.filter((o) => o.isActive));
        setSuppliers(suppliersResult.filter((s) => s.isActive));
      } catch {
        setOutlets([]);
        setSuppliers([]);
      }
    }
    void loadLookups();
  }, []);

  useEffect(() => {
    if (!isPrivileged) {
      setOutletId(session?.outletId ?? "");
    }
  }, [isPrivileged, session?.outletId]);

  async function handleSearch() {
    if (!supplierId) {
      setError("Supplier wajib dipilih.");
      return;
    }
    if (!dateFrom || !dateTo) {
      setError("Periode wajib diisi.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await getSupplierReport({
        dateFrom,
        dateTo,
        supplierId,
        outletId: effectiveOutletId || undefined,
      });
      setReport(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat laporan supplier."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExport() {
    if (!supplierId) {
      setError("Pilih supplier terlebih dahulu.");
      return;
    }
    setIsExporting(true);
    setError(null);
    try {
      const file = await exportSupplierReportExcel({
        dateFrom,
        dateTo,
        supplierId,
        outletId: effectiveOutletId || undefined,
      });
      const url = window.URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      const formattedStart = dateFrom.replace(/-/g, "");
      const formattedEnd = dateTo.replace(/-/g, "");
      link.setAttribute("download", `Laporan_Supplier_${formattedStart}_${formattedEnd}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal mengekspor laporan supplier."));
    } finally {
      setIsExporting(false);
    }
  }

  const summary = useMemo(() => report?.summary ?? null, [report]);

  return (
    <ProtectedPageShell
      title="Laporan Supplier 360"
      description="Analisis pembelian, retur, hutang, pembayaran, dan aktivitas konsinyasi per supplier dalam satu tampilan."
    >
      <InlineAlert tone="error" message={error} />

      <section className="mb-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid gap-4 lg:grid-cols-5">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tanggal Mulai *</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tanggal Akhir *</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Supplier *</span>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Pilih supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          {isPrivileged ? (
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Outlet</span>
              <select
                value={outletId}
                onChange={(e) => setOutletId(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Semua outlet</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => void handleSearch()}
              disabled={isLoading}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isLoading ? "Memuat..." : "Tampilkan"}
            </button>
          </div>
        </div>
        <div className="mt-4 flex gap-2 app-no-print">
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={isLoading || isExporting || !report}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-700 disabled:opacity-60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {isExporting ? "Mengekspor..." : "Ekspor Excel"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!report}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-white disabled:opacity-60"
          >
            Cetak
          </button>
        </div>
      </section>

      {isLoading ? (
        <AppLoader label="Memuat laporan supplier..." />
      ) : !report || !summary ? (
        <PagePlaceholder
          title="Pilih filter untuk menampilkan laporan"
          description="Pilih periode dan supplier, lalu tekan Tampilkan untuk melihat ringkasan 360 derajat."
          status="Menunggu filter"
        />
      ) : (
        <div className="report-print-root space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {report.supplier?.supplierName ?? "Supplier"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Periode {dateFrom} s/d {dateTo} • {report.supplier?.phone ?? "-"} • {report.supplier?.email ?? "-"}
            </p>
            <p className="text-xs text-gray-400">{report.supplier?.address ?? ""}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <SummaryCard label="Total Pembelian" value={summary.totalPurchase} />
            <SummaryCard label="Retur Pembelian" value={summary.totalPurchaseReturn} />
            <SummaryCard label="Pembelian Bersih" value={summary.netPurchase} />
            <SummaryCard label="Total Pembayaran Hutang" value={summary.totalDebtPayment} />
            <SummaryCard label="Saldo Hutang Akhir" value={summary.outstandingDebt} />
            <SummaryCard label="Konsinyasi Diterima" value={summary.consignmentReceivedValue} />
            <SummaryCard label="Return Konsinyasi" value={summary.consignmentReturnValue} />
            <SummaryCard label="Penjualan Konsinyasi" value={summary.consignmentSalesValue} />
            <SummaryCard label="Settlement" value={summary.settlementValue} />
          </div>

          {/* Group 1: Pembelian */}
          <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pembelian</h3>
              <p className="text-xs text-gray-500">Daftar PO completed pada periode terpilih.</p>
            </div>
            {report.purchases.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">Tidak ada pembelian.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-950">
                    <tr>
                      {["No. PO", "Tanggal", "Outlet", "Status", "Tipe", "Total"].map((c) => (
                        <th key={c} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {report.purchases.map((p) => (
                      <tr key={p.purchaseOrderId}>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">{p.poNumber}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{formatDate(p.poDate)}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{p.outletName}</td>
                        <td className="px-6 py-3 text-sm">{p.status}</td>
                        <td className="px-6 py-3 text-sm">{p.paymentType}</td>
                        <td className="px-6 py-3 text-sm font-semibold">{formatCurrency(p.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Group 2: Retur Pembelian */}
          <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Retur Pembelian</h3>
            </div>
            {report.purchaseReturns.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">Tidak ada retur pembelian.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-950">
                    <tr>
                      {["No. Retur", "Tanggal", "Status", "Total", "No. PO", "Outlet"].map((c) => (
                        <th key={c} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {report.purchaseReturns.map((r) => (
                      <tr key={r.returnId}>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">{r.returnNumber}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{formatDate(r.returnDate)}</td>
                        <td className="px-6 py-3 text-sm">{r.status}</td>
                        <td className="px-6 py-3 text-sm font-semibold">{formatCurrency(r.totalAmount)}</td>
                        <td className="px-6 py-3 text-sm">{r.poNumber}</td>
                        <td className="px-6 py-3 text-sm">{r.outletName ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Group 3: Hutang & Pembayaran */}
          <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hutang & Pembayaran</h3>
            </div>
            <div className="grid gap-6 p-6 lg:grid-cols-2">
              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">Hutang</h4>
                {report.debts.length === 0 ? (
                  <p className="text-sm text-gray-500">Tidak ada hutang.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                      <thead className="bg-gray-50 dark:bg-gray-950">
                        <tr>
                          {["PO", "Jatuh Tempo", "Hutang", "Terbayar", "Sisa", "Status"].map((c) => (
                            <th key={c} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {report.debts.map((d) => (
                          <tr key={d.debtId}>
                            <td className="px-4 py-2 text-sm">{d.poNumber}</td>
                            <td className="px-4 py-2 text-sm">{formatDate(d.dueDate)}</td>
                            <td className="px-4 py-2 text-sm">{formatCurrency(d.amount)}</td>
                            <td className="px-4 py-2 text-sm">{formatCurrency(d.paidAmount)}</td>
                            <td className="px-4 py-2 text-sm font-semibold">{formatCurrency(d.remainingAmount)}</td>
                            <td className="px-4 py-2 text-sm">{d.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">Pembayaran</h4>
                {report.payments.length === 0 ? (
                  <p className="text-sm text-gray-500">Tidak ada pembayaran.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                      <thead className="bg-gray-50 dark:bg-gray-950">
                        <tr>
                          {["Tanggal", "PO", "Metode", "Nominal", "Referensi"].map((c) => (
                            <th key={c} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {report.payments.map((p) => (
                          <tr key={p.paymentId}>
                            <td className="px-4 py-2 text-sm">{formatDate(p.paymentDate)}</td>
                            <td className="px-4 py-2 text-sm">{p.poNumber}</td>
                            <td className="px-4 py-2 text-sm">{p.paymentMethod}</td>
                            <td className="px-4 py-2 text-sm font-semibold">{formatCurrency(p.amount)}</td>
                            <td className="px-4 py-2 text-sm">{p.referenceNumber ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Group 4: Konsinyasi & Settlement */}
          <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Aktivitas Konsinyasi & Settlement</h3>
            </div>
            <div className="space-y-6 p-6">
              <div>
                <h4 className="mb-3 text-sm font-semibold">Ambil Konsinyasi (Masuk)</h4>
                {report.consignments.length === 0 ? (
                  <p className="text-sm text-gray-500">Tidak ada ambil konsinyasi.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                      <thead className="bg-gray-50 dark:bg-gray-950">
                        <tr>
                          {["No. Konsinyasi", "Tanggal", "Status", "Nilai", "Item", "Outlet"].map((c) => (
                            <th key={c} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {report.consignments.map((c) => (
                          <tr key={c.consignmentId}>
                            <td className="px-4 py-2 text-sm font-medium">{c.consignmentNumber}</td>
                            <td className="px-4 py-2 text-sm">{formatDate(c.receiveDate)}</td>
                            <td className="px-4 py-2 text-sm">{c.status}</td>
                            <td className="px-4 py-2 text-sm font-semibold">{formatCurrency(c.totalValue)}</td>
                            <td className="px-4 py-2 text-sm">{c.itemCount}</td>
                            <td className="px-4 py-2 text-sm">{c.outletName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold">Return Konsinyasi</h4>
                {report.consignmentReturns.length === 0 ? (
                  <p className="text-sm text-gray-500">Tidak ada return konsinyasi.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                      <thead className="bg-gray-50 dark:bg-gray-950">
                        <tr>
                          {["No. Return", "Tanggal", "Status", "Qty", "Item", "Outlet"].map((c) => (
                            <th key={c} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {report.consignmentReturns.map((cr) => (
                          <tr key={cr.returnId}>
                            <td className="px-4 py-2 text-sm font-medium">{cr.returnNumber}</td>
                            <td className="px-4 py-2 text-sm">{formatDate(cr.returnDate)}</td>
                            <td className="px-4 py-2 text-sm">{cr.status}</td>
                            <td className="px-4 py-2 text-sm">{cr.totalQty}</td>
                            <td className="px-4 py-2 text-sm">{cr.itemCount}</td>
                            <td className="px-4 py-2 text-sm">{cr.outletName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold">Penjualan Konsinyasi</h4>
                {report.consignmentSales.length === 0 ? (
                  <p className="text-sm text-gray-500">Tidak ada penjualan konsinyasi.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                      <thead className="bg-gray-50 dark:bg-gray-950">
                        <tr>
                          {["No. Transaksi", "Tanggal", "Produk", "Qty", "Unit Cost", "Total", "Status"].map((c) => (
                            <th key={c} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {report.consignmentSales.map((cs) => (
                          <tr key={cs.consignmentSaleId}>
                            <td className="px-4 py-2 text-sm">{cs.transactionNumber}</td>
                            <td className="px-4 py-2 text-sm">{formatDate(cs.createdAt)}</td>
                            <td className="px-4 py-2 text-sm">{cs.productName}</td>
                            <td className="px-4 py-2 text-sm">{cs.qty}</td>
                            <td className="px-4 py-2 text-sm">{formatCurrency(cs.unitCost)}</td>
                            <td className="px-4 py-2 text-sm font-semibold">{formatCurrency(cs.totalAmount)}</td>
                            <td className="px-4 py-2 text-sm">{cs.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold">Settlement</h4>
                {report.settlements.length === 0 ? (
                  <p className="text-sm text-gray-500">Tidak ada settlement.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                      <thead className="bg-gray-50 dark:bg-gray-950">
                        <tr>
                          {["No. Settlement", "Tanggal", "Total", "Status", "Sales", "Outlet"].map((c) => (
                            <th key={c} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {report.settlements.map((s) => (
                          <tr key={s.settlementId}>
                            <td className="px-4 py-2 text-sm font-medium">{s.settlementNumber}</td>
                            <td className="px-4 py-2 text-sm">{formatDate(s.settlementDate)}</td>
                            <td className="px-4 py-2 text-sm font-semibold">{formatCurrency(s.totalAmount)}</td>
                            <td className="px-4 py-2 text-sm">{s.status}</td>
                            <td className="px-4 py-2 text-sm">{s.salesCount}</td>
                            <td className="px-4 py-2 text-sm">{s.outletName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </ProtectedPageShell>
  );
}

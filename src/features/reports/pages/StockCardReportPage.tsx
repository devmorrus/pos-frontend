import { useEffect, useMemo, useState } from "react";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { useAuth } from "../../auth/hooks/useAuth";
import { getOutlets } from "../../outlets/api/outletsApi";
import type { OutletDto } from "../../outlets/types/outlet";
import { useOutlet } from "../../outlets/hooks/useOutlet";
import { getProducts } from "../../products/api/productsApi";
import type { ProductDto } from "../../products/types/product";
import { exportStockCardReportExcel, getStockCardReport } from "../api/reportsApi";
import type { StockCardReportDto } from "../types/reports";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
      <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{value.toLocaleString("id-ID")}</p>
    </div>
  );
}

export default function StockCardReportPage() {
  const { session } = useAuth();
  const { selectedOutletId } = useOutlet();
  const [report, setReport] = useState<StockCardReportDto | null>(null);
  const [outlets, setOutlets] = useState<OutletDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [dateFrom, setDateFrom] = useState(getStartOfMonthInput);
  const [dateTo, setDateTo] = useState(getTodayInput);
  const [outletId, setOutletId] = useState<string>("");
  const [productId, setProductId] = useState<string>("");
  const [variantId, setVariantId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPrivileged = session?.role === "Owner" || session?.role === "Admin";
  const effectiveOutletId = isPrivileged ? outletId || selectedOutletId || "" : session?.outletId ?? "";

  useEffect(() => {
    async function loadOutlets() {
      try {
        const result = await getOutlets();
        setOutlets(result.filter((o) => o.isActive));
      } catch {
        setOutlets([]);
      }
    }
    void loadOutlets();
  }, []);

  useEffect(() => {
    if (!isPrivileged) {
      setOutletId(session?.outletId ?? "");
    }
  }, [isPrivileged, session?.outletId]);

  useEffect(() => {
    async function loadProducts() {
      if (!effectiveOutletId) {
        setProducts([]);
        return;
      }
      try {
        const result = await getProducts({ outletId: effectiveOutletId });
        setProducts(result);
      } catch {
        setProducts([]);
      }
    }
    void loadProducts();
  }, [effectiveOutletId]);

  const selectedProduct = useMemo(() => products.find((p) => p.id === productId) ?? null, [products, productId]);
  const variantOptions = useMemo(() => selectedProduct?.variants ?? [], [selectedProduct]);

  useEffect(() => {
    setVariantId("");
  }, [productId]);

  async function handleSearch() {
    if (!effectiveOutletId) {
      setError("Outlet wajib dipilih.");
      return;
    }
    if (!productId) {
      setError("Produk wajib dipilih.");
      return;
    }
    if (!dateFrom || !dateTo) {
      setError("Periode wajib diisi.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await getStockCardReport({
        dateFrom,
        dateTo,
        outletId: effectiveOutletId,
        productId,
        productVariantId: variantId || undefined,
      });
      setReport(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat kartu stok."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExport() {
    if (!report) return;
    setIsExporting(true);
    setError(null);
    try {
      const file = await exportStockCardReportExcel({
        dateFrom,
        dateTo,
        outletId: effectiveOutletId,
        productId,
        productVariantId: variantId || undefined,
      });
      const url = window.URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      const formattedStart = dateFrom.replace(/-/g, "");
      const formattedEnd = dateTo.replace(/-/g, "");
      link.setAttribute("download", `Kartu_Stok_${report.product.sku}_${formattedStart}_${formattedEnd}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal mengekspor kartu stok."));
    } finally {
      setIsExporting(false);
    }
  }

  const summary = report?.summary;

  return (
    <ProtectedPageShell title="Kartu Stok" description="Telusuri mutasi stok per produk/varian dan outlet dalam periode tertentu dengan saldo berjalan.">
      <InlineAlert tone="error" message={error} />

      <section className="mb-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid gap-4 lg:grid-cols-6">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tanggal Mulai *</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tanggal Akhir *</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </label>
          {isPrivileged ? (
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Outlet *</span>
              <select value={outletId} onChange={(e) => setOutletId(e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <option value="">Pilih outlet</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Produk *</span>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <option value="">Pilih produk</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Varian</span>
            <select value={variantId} onChange={(e) => setVariantId(e.target.value)} disabled={!selectedProduct?.hasVariants} className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white disabled:opacity-60">
              <option value="">{selectedProduct?.hasVariants ? "Semua / Pilih varian" : "Tidak ada varian"}</option>
              {variantOptions.map((v) => (
                <option key={v.id} value={v.id}>{v.sku} - {v.attributeValues.map((av) => av.value).join(", ")}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button type="button" onClick={() => void handleSearch()} disabled={isLoading} className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white disabled:opacity-60">
              {isLoading ? "Memuat..." : "Tampilkan"}
            </button>
          </div>
        </div>
        <div className="mt-4 flex gap-2 app-no-print">
          <button type="button" onClick={() => void handleExport()} disabled={isLoading || isExporting || !report} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-700 disabled:opacity-60">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            {isExporting ? "Mengekspor..." : "Ekspor Excel"}
          </button>
          <button type="button" onClick={() => window.print()} disabled={!report} className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-white disabled:opacity-60">
            Cetak
          </button>
        </div>
      </section>

      {isLoading ? (
        <AppLoader label="Memuat kartu stok..." />
      ) : !report || !summary ? (
        <PagePlaceholder title="Pilih filter untuk menampilkan kartu stok" description="Pilih outlet, produk (dan varian jika ada) serta periode untuk melihat saldo awal, mutasi, dan saldo berjalan." status="Menunggu filter" />
      ) : (
        <div className="report-print-root space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{report.product.productName} ({report.product.sku})</h3>
            <p className="mt-1 text-sm text-gray-500">
              Outlet: {report.outletName} • Periode {dateFrom} s/d {dateTo}
              {report.product.productVariantId ? ` • Varian: ${report.product.variantSku}` : ""}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Saldo Awal" value={summary.openingBalance} />
            <SummaryCard label="Total Masuk" value={summary.totalIn} />
            <SummaryCard label="Total Keluar" value={summary.totalOut} />
            <SummaryCard label="Saldo Akhir" value={summary.closingBalance} />
          </div>

          <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mutasi Kartu Stok</h3>
              <p className="mt-1 text-xs text-gray-500">Menampilkan mutasi berurutan berdasarkan waktu dengan saldo berjalan setiap baris.</p>
            </div>
            {report.lines.length === 0 ? (
              <div className="p-6">
                <PagePlaceholder title="Tidak ada mutasi pada periode ini" description="Coba ubah periode atau pilih produk/varian lain." status="Data kosong" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-950">
                    <tr>
                      {["Tanggal/Waktu", "Produk-Varian", "Jenis Mutasi", "Referensi", "Catatan", "Masuk", "Keluar", "Saldo Berjalan"].map((c) => (
                        <th key={c} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {report.lines.map((line) => (
                      <tr key={line.ledgerId}>
                        <td className="px-6 py-3 text-xs text-gray-700 dark:text-gray-300">{formatDateTime(line.createdAt)}</td>
                        <td className="px-6 py-3 text-xs font-medium text-gray-900 dark:text-white">
                          {line.productVariantId ? `${line.productName} - ${line.variantSku}` : line.productName}
                        </td>
                        <td className="px-6 py-3 text-xs">
                          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                            {line.movementLabel}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-xs text-gray-600 dark:text-gray-300">{line.referenceNumber ?? line.referenceType}</td>
                        <td className="px-6 py-3 text-xs text-gray-600 dark:text-gray-300 max-w-xs truncate" title={line.note ?? ""}>{line.note || "—"}</td>
                        <td className="px-6 py-3 text-right text-xs font-semibold text-success-700 dark:text-success-300">{line.qtyIn > 0 ? line.qtyIn.toLocaleString("id-ID") : "—"}</td>
                        <td className="px-6 py-3 text-right text-xs font-semibold text-error-600 dark:text-error-300">{line.qtyOut > 0 ? line.qtyOut.toLocaleString("id-ID") : "—"}</td>
                        <td className="px-6 py-3 text-right text-xs font-bold text-gray-900 dark:text-white">{line.runningBalance.toLocaleString("id-ID")}</td>
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

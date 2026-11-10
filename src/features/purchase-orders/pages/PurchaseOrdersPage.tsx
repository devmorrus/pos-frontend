import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { BoxIcon, CheckCircleIcon, DocsIcon, PlusIcon, TimeIcon, UserIcon } from "../../../icons";
import { accentFor } from "../../../utils/accent";
import { getErrorMessage } from "../../../utils/errors";
import ProcurementOutletSelector from "../../procurement/components/ProcurementOutletSelector";
import { useProcurementOutletScope } from "../../procurement/hooks/useProcurementOutletScope";
import { formatCurrency, formatDateOnly, formatDateTime, getPoStatusClasses } from "../../procurement/utils/formatters";
import { getPurchaseOrders } from "../api/purchaseOrdersApi";
import type { PurchaseOrderDto } from "../types/purchaseOrder";

type PurchaseOrdersLocationState = { successMessage?: string };

export default function PurchaseOrdersPage() {
  const location = useLocation();
  const { ownerMode, activeOutlets, effectiveOutletId, selectedOutletId, setSelectedOutletId } = useProcurementOutletScope();
  const [orders, setOrders] = useState<PurchaseOrderDto[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage] = useState<string | null>((location.state as PurchaseOrdersLocationState | null)?.successMessage ?? null);

  async function loadOrders() {
    if (!effectiveOutletId) {
      setOrders([]); setError(null); setIsLoading(false); return;
    }
    setIsLoading(true); setError(null);
    try { setOrders(await getPurchaseOrders({ outletId: effectiveOutletId })); }
    catch (requestError) { setError(getErrorMessage(requestError, "Gagal memuat daftar purchase order.")); }
    finally { setIsLoading(false); }
  }

  useEffect(() => { void loadOrders(); }, [effectiveOutletId]);

  const filteredOrders = useMemo(
    () => statusFilter === "all" ? orders : orders.filter((order) => order.status === statusFilter),
    [orders, statusFilter],
  );
  const statusCounts = useMemo(() => ({
    all: orders.length,
    draft: orders.filter((order) => order.status === "draft").length,
    pending: orders.filter((order) => order.status === "pending").length,
    completed: orders.filter((order) => order.status === "completed").length,
  }), [orders]);
  const shouldShowOutletPrompt = ownerMode && !effectiveOutletId;

  return (
    <ProtectedPageShell title="Purchase Order" description="Kelola pembelian supplier tunai maupun tempo per outlet procurement aktif.">
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-brand-50 via-white to-white p-6 shadow-theme-xs dark:border-gray-800 dark:from-brand-500/10 dark:via-gray-900 dark:to-gray-900 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-center">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/25"><DocsIcon className="h-8 w-8" /></div>
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Procurement workspace</p><h3 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">Purchase order lebih terkontrol</h3></div>
            </div>
            <p className="mt-5 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-300">Pantau pembelian supplier, status persetujuan, dan nilai transaksi dari satu ruang kerja yang rapi.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total PO", value: statusCounts.all, icon: <DocsIcon className="h-5 w-5" />, tone: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300" },
              { label: "Draft", value: statusCounts.draft, icon: <BoxIcon className="h-5 w-5" />, tone: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" },
              { label: "Pending", value: statusCounts.pending, icon: <TimeIcon className="h-5 w-5" />, tone: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-300" },
              { label: "Completed", value: statusCounts.completed, icon: <CheckCircleIcon className="h-5 w-5" />, tone: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-300" },
            ].map((stat) => <div key={stat.label} className="flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white/80 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.tone}`}>{stat.icon}</div><p className="flex-1 text-sm text-gray-500 dark:text-gray-400">{stat.label}</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p></div>)}
          </div>
        </div>
      </section>

      <AppTableShell title="Daftar purchase order" description={`${filteredOrders.length} dokumen pada filter yang sedang dipilih`} actions={<><ProcurementOutletSelector ownerMode={ownerMode} value={selectedOutletId} onChange={setSelectedOutletId} outlets={activeOutlets} /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"><option value="all">Semua status</option><option value="draft">Draft</option><option value="pending">Pending</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><Link to="/purchase-orders/create" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600"><PlusIcon className="h-4 w-4" />Buat PO</Link></>}>
        {isLoading ? <AppLoader label="Memuat daftar purchase order..." /> : shouldShowOutletPrompt ? <div className="p-6"><PagePlaceholder title="Pilih outlet procurement terlebih dahulu" description="Owner perlu memilih outlet aktif agar daftar purchase order dan utang supplier memakai konteks yang benar." status="Outlet required" /></div> : filteredOrders.length === 0 ? <div className="p-6"><PagePlaceholder title="Belum ada purchase order" description="Buat PO pertama untuk mulai mencatat pembelian supplier pada outlet ini." status="Empty" /></div> : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredOrders.map((order) => <li key={order.id} className="group flex flex-col gap-4 px-5 py-5 transition hover:bg-gray-50/80 dark:hover:bg-white/[0.02] xl:flex-row xl:items-center sm:px-6">
              <div className="flex min-w-0 flex-1 items-center gap-3"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${accentFor(order.poNumber)}`}>{order.poNumber.slice(-2)}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{order.poNumber}</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{formatDateTime(order.poDate)} · {order.outletName}</p></div></div>
              <div className="grid gap-2 pl-15 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2 xl:min-w-[38%] xl:pl-0"><span className="inline-flex items-center gap-2"><UserIcon className="h-4 w-4 text-brand-500" />{order.supplierName}</span><span className="capitalize">{order.paymentType} · Jatuh tempo {formatDateOnly(order.dueDate)}</span></div>
              <div className="flex items-center justify-between gap-3 pl-15 xl:ml-auto xl:justify-end xl:pl-0"><div><p className="text-[11px] uppercase tracking-wider text-gray-400">Total</p><p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(order.totalAmount)}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPoStatusClasses(order.status)}`}>{order.status}</span><Link to={`/purchase-orders/${order.id}`} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-brand-500/10">Detail</Link></div>
            </li>)}
          </ul>
        )}
      </AppTableShell>
    </ProtectedPageShell>
  );
}

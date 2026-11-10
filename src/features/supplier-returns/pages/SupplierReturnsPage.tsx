import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, ConfirmDialog, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { BoxIcon, CheckCircleIcon, PencilIcon, PlusIcon, PaperPlaneIcon, TrashBinIcon } from "../../../icons";
import { accentFor } from "../../../utils/accent";
import ProcurementOutletSelector from "../../procurement/components/ProcurementOutletSelector";
import { useProcurementOutletScope } from "../../procurement/hooks/useProcurementOutletScope";
import { getErrorMessage } from "../../../utils/errors";
import { getSuppliers } from "../../suppliers/api/suppliersApi";
import type { SupplierDto } from "../../suppliers/types/supplier";
import { deleteSupplierReturn, getSupplierReturns, updateSupplierReturnStatus } from "../api/supplierReturnsApi";
import type { SupplierReturnListItemDto } from "../types/supplierReturn";
import { formatCurrency, formatDateTime, getSupplierReturnStatusClasses } from "../utils/formatters";

export default function SupplierReturnsPage() {
  const { ownerMode, activeOutlets, effectiveOutletId, selectedOutletId, setSelectedOutletId } = useProcurementOutletScope();
  const [returns, setReturns] = useState<SupplierReturnListItemDto[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [supplierFilter, setSupplierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusyId, setIsBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplierReturnListItemDto | null>(null);

  async function loadData() {
    if (!effectiveOutletId) { setReturns([]); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      const [returnsResult, suppliersResult] = await Promise.all([
        getSupplierReturns({ outletId: effectiveOutletId, supplierId: supplierFilter || undefined, status: statusFilter }),
        getSuppliers(),
      ]);
      setReturns(returnsResult); setSuppliers(suppliersResult);
    } catch (requestError) { setError(getErrorMessage(requestError, "Gagal memuat retur supplier.")); }
    finally { setIsLoading(false); }
  }
  useEffect(() => { void loadData(); }, [effectiveOutletId, supplierFilter, statusFilter]);

  const shouldShowOutletPrompt = ownerMode && !effectiveOutletId;
  const activeSupplierName = useMemo(() => suppliers.find((supplier) => supplier.id === supplierFilter)?.name ?? "Semua supplier", [suppliers, supplierFilter]);
  const statusCounts = { draft: returns.filter((item) => item.status === "draft").length, sent: returns.filter((item) => item.status === "sent").length, completed: returns.filter((item) => item.status === "completed").length };
  const totalAmount = returns.reduce((sum, item) => sum + item.totalAmount, 0);

  async function handleStatus(id: string, status: "sent" | "completed") {
    setIsBusyId(id); setError(null);
    try { await updateSupplierReturnStatus(id, { status }); await loadData(); }
    catch (requestError) { setError(getErrorMessage(requestError, "Gagal memperbarui status retur supplier.")); }
    finally { setIsBusyId(null); }
  }
  async function handleDelete() {
    if (!deleteTarget) return;
    setIsBusyId(deleteTarget.id); setError(null);
    try { await deleteSupplierReturn(deleteTarget.id); setDeleteTarget(null); await loadData(); }
    catch (requestError) { setError(getErrorMessage(requestError, "Gagal menghapus retur supplier.")); }
    finally { setIsBusyId(null); }
  }

  return <ProtectedPageShell title="Supplier Return" description="Kelola retur barang pembelian ke supplier hingga proses selesai dan stok outlet disesuaikan.">
    <InlineAlert tone="error" message={error} />
    <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-brand-50 via-white to-white p-6 shadow-theme-xs dark:border-gray-800 dark:from-brand-500/10 dark:via-gray-900 dark:to-gray-900 sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="relative grid gap-8 lg:grid-cols-[1fr_1.35fr] lg:items-center"><div><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/25"><PaperPlaneIcon className="h-8 w-8" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Supplier operations</p><h3 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">Retur supplier lebih rapi</h3></div></div><p className="mt-5 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-300">Kelola pengembalian barang, pantau progres proses retur, dan pastikan penyesuaian stok tercatat dengan jelas.</p></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-gray-200/80 bg-white/80 p-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70 sm:col-span-2"><p className="text-xs uppercase tracking-wider text-gray-500">Nilai retur aktif</p><p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{returns.length} dokumen · {activeSupplierName}</p></div>{[{ label: "Draft", value: statusCounts.draft, icon: <BoxIcon className="h-5 w-5" />, tone: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" }, { label: "Terkirim", value: statusCounts.sent, icon: <PaperPlaneIcon className="h-5 w-5" />, tone: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-300" }, { label: "Selesai", value: statusCounts.completed, icon: <CheckCircleIcon className="h-5 w-5" />, tone: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-300" }].map((stat) => <div key={stat.label} className="flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white/80 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tone}`}>{stat.icon}</div><p className="flex-1 text-sm text-gray-500 dark:text-gray-400">{stat.label}</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p></div>)}</div></div>
    </section>
    <AppTableShell title="Daftar retur supplier" description={`${returns.length} retur • ${activeSupplierName}`} actions={<><ProcurementOutletSelector ownerMode={ownerMode} value={selectedOutletId} onChange={setSelectedOutletId} outlets={activeOutlets} /><select value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)} className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"><option value="">Semua supplier</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"><option value="all">Semua status</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="completed">Completed</option></select><Link to="/supplier-returns/create" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600"><PlusIcon className="h-4 w-4" />Buat retur</Link></>}>
      {isLoading ? <AppLoader label="Memuat retur supplier..." /> : shouldShowOutletPrompt ? <div className="p-6"><PagePlaceholder title="Pilih outlet procurement terlebih dahulu" description="Owner perlu memilih outlet aktif agar data retur supplier menggunakan konteks cabang yang benar." status="Outlet required" /></div> : returns.length === 0 ? <div className="p-6"><PagePlaceholder title="Belum ada retur supplier" description="Buat retur baru saat ada barang pembelian yang harus dikembalikan ke supplier." status="Empty" /></div> : <ul className="divide-y divide-gray-100 dark:divide-gray-800">{returns.map((item) => <li key={item.id} className="flex flex-col gap-4 px-5 py-5 transition hover:bg-gray-50/80 dark:hover:bg-white/[0.02] xl:flex-row xl:items-center sm:px-6"><div className="flex min-w-0 flex-1 items-center gap-3"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${accentFor(item.supplierName)}`}>{item.returnNumber.slice(-2)}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{item.returnNumber}</p><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getSupplierReturnStatusClasses(item.status)}`}>{item.status}</span></div><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.supplierName} · {formatDateTime(item.returnDate)}</p></div></div><div className="grid gap-2 pl-15 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2 xl:min-w-[38%] xl:pl-0"><span>{item.purchaseOrderNumber} · {item.outletName}</span><span>Dibuat oleh {item.createdByName}</span></div><div className="flex items-center justify-between gap-3 pl-15 xl:ml-auto xl:justify-end xl:pl-0"><p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(item.totalAmount)}</p><Link to={`/supplier-returns/${item.id}`} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-brand-50 hover:text-brand-600 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-brand-500/10">Detail</Link>{item.status === "draft" ? <><Link to={`/supplier-returns/${item.id}/edit`} aria-label={`Edit ${item.returnNumber}`} className="rounded-xl border border-gray-200 p-2 text-gray-600 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-800 dark:text-gray-300"><PencilIcon className="h-4 w-4" /></Link><button type="button" disabled={isBusyId === item.id} onClick={() => void handleStatus(item.id, "sent")} className="inline-flex items-center gap-1.5 rounded-xl bg-warning-500 px-3 py-2 text-xs font-semibold text-white"><PaperPlaneIcon className="h-3.5 w-3.5" />Kirim</button><button type="button" disabled={isBusyId === item.id} onClick={() => setDeleteTarget(item)} aria-label={`Hapus ${item.returnNumber}`} className="rounded-xl bg-error-500 p-2 text-white"><TrashBinIcon className="h-4 w-4" /></button></> : null}{item.status === "sent" ? <button type="button" disabled={isBusyId === item.id} onClick={() => void handleStatus(item.id, "completed")} className="inline-flex items-center gap-1.5 rounded-xl bg-success-500 px-3 py-2 text-xs font-semibold text-white"><CheckCircleIcon className="h-3.5 w-3.5" />Selesaikan</button> : null}</div></li>)}</ul>}
    </AppTableShell>
    <ConfirmDialog open={deleteTarget !== null} title="Hapus retur supplier" description={`Retur ${deleteTarget?.returnNumber ?? ""} akan dihapus permanen karena masih draft.`} confirmLabel="Hapus draft" isBusy={deleteTarget !== null && isBusyId === deleteTarget.id} onConfirm={() => void handleDelete()} onCancel={() => setDeleteTarget(null)} />
  </ProtectedPageShell>;
}

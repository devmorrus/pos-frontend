import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { Modal } from "../../../components/ui/modal";
import { BoxIcon, CheckCircleIcon, DollarLineIcon, DocsIcon, TimeIcon } from "../../../icons";
import { accentFor } from "../../../utils/accent";
import { getErrorMessage } from "../../../utils/errors";
import ProcurementOutletSelector from "../../procurement/components/ProcurementOutletSelector";
import { useProcurementOutletScope } from "../../procurement/hooks/useProcurementOutletScope";
import { formatCurrency, formatDateOnly, getDebtStatusClasses } from "../../procurement/utils/formatters";
import { getSupplierDebtByPoId, getSupplierDebts, paySupplierDebt } from "../api/debtsApi";
import PaySupplierDebtModal from "../components/PaySupplierDebtModal";
import type { SupplierDebtDto, SupplierPaymentFormValues } from "../types/debt";

export default function SupplierDebtsPage() {
  const { ownerMode, activeOutlets, effectiveOutletId, selectedOutletId, setSelectedOutletId } =
    useProcurementOutletScope();
  const [debts, setDebts] = useState<SupplierDebtDto[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailPoId, setDetailPoId] = useState<string | null>(null);
  const [detailDebt, setDetailDebt] = useState<SupplierDebtDto | null>(null);
  const [payTarget, setPayTarget] = useState<SupplierDebtDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const paymentAttemptRef = useRef<{ fingerprint: string; id: string } | null>(null);
  const paymentInFlightRef = useRef(false);

  async function loadDebts() {
    if (!effectiveOutletId) {
      setDebts([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setDebts(await getSupplierDebts({ outletId: effectiveOutletId, status: statusFilter }));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat daftar utang supplier."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDebts();
  }, [effectiveOutletId, statusFilter]);

  useEffect(() => {
    async function loadDetail() {
      if (!detailPoId) {
        setDetailDebt(null);
        return;
      }

      setIsLoadingDetail(true);

      try {
        setDetailDebt(await getSupplierDebtByPoId(detailPoId));
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat detail utang supplier."));
      } finally {
        setIsLoadingDetail(false);
      }
    }

    void loadDetail();
  }, [detailPoId]);

  const shouldShowOutletPrompt = ownerMode && !effectiveOutletId;
  const totals = debts.reduce(
    (summary, debt) => ({
      amount: summary.amount + debt.amount,
      paid: summary.paid + debt.paidAmount,
      remaining: summary.remaining + debt.remainingAmount,
    }),
    { amount: 0, paid: 0, remaining: 0 },
  );
  const statusCounts = {
    unpaid: debts.filter((debt) => debt.status === "unpaid").length,
    partiallyPaid: debts.filter((debt) => debt.status === "partially_paid").length,
    paid: debts.filter((debt) => debt.status === "paid").length,
  };

  async function handlePayDebt(values: SupplierPaymentFormValues) {
    if (!payTarget) {
      return;
    }

    const fingerprint = JSON.stringify({
      purchaseOrderId: payTarget.purchaseOrderId,
      amount: Number(values.amount),
      paymentMethod: values.paymentMethod.trim(),
      referenceNumber: values.referenceNumber.trim() || null,
    });
    if (!paymentAttemptRef.current || paymentAttemptRef.current.fingerprint !== fingerprint)
      paymentAttemptRef.current = { fingerprint, id: crypto.randomUUID() };
    if (paymentInFlightRef.current) return;
    paymentInFlightRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await paySupplierDebt({
        id: paymentAttemptRef.current.id,
        purchaseOrderId: payTarget.purchaseOrderId,
        amount: Number(values.amount),
        paymentMethod: values.paymentMethod.trim(),
        referenceNumber: values.referenceNumber.trim() || null,
      });
      setSuccessMessage(`Pembayaran utang untuk PO ${payTarget.poNumber} berhasil dicatat.`);
      setPayTarget(null);
      paymentAttemptRef.current = null;
      await loadDebts();

      if (detailPoId === payTarget.purchaseOrderId) {
        setDetailDebt(await getSupplierDebtByPoId(payTarget.purchaseOrderId));
      }
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError, "Gagal menyimpan pembayaran utang supplier."));
    } finally {
      paymentInFlightRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Utang Supplier"
      description="Monitor utang usaha supplier, lihat detail tagihan per PO, dan catat pembayaran parsial atau pelunasan."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-brand-50 via-white to-white p-6 shadow-theme-xs dark:border-gray-800 dark:from-brand-500/10 dark:via-gray-900 dark:to-gray-900 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_1.35fr] lg:items-center">
          <div><div className="flex items-center gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/25"><DollarLineIcon className="h-8 w-8" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Financial control</p><h3 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">Utang supplier lebih terkendali</h3></div></div><p className="mt-5 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-300">Pantau kewajiban pembayaran, progres pelunasan, dan tagihan supplier berdasarkan outlet procurement aktif.</p></div>
          <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-gray-200/80 bg-white/80 p-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70 sm:col-span-2"><p className="text-xs uppercase tracking-wider text-gray-500">Sisa utang supplier</p><p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(totals.remaining)}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-success-500" style={{ width: `${totals.amount ? Math.min(100, (totals.paid / totals.amount) * 100) : 0}%` }} /></div><p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{formatCurrency(totals.paid)} sudah terbayar dari {formatCurrency(totals.amount)}</p></div>{[{ label: "Belum dibayar", value: statusCounts.unpaid, icon: <TimeIcon className="h-5 w-5" />, tone: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-300" }, { label: "Sebagian dibayar", value: statusCounts.partiallyPaid, icon: <BoxIcon className="h-5 w-5" />, tone: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300" }, { label: "Lunas", value: statusCounts.paid, icon: <CheckCircleIcon className="h-5 w-5" />, tone: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-300" }].map((stat) => <div key={stat.label} className="flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white/80 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tone}`}>{stat.icon}</div><p className="flex-1 text-sm text-gray-500 dark:text-gray-400">{stat.label}</p><p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p></div>)}</div>
        </div>
      </section>

      <AppTableShell
        title="Daftar utang supplier"
        description={`${debts.length} tagihan pada outlet dan filter yang dipilih`}
        actions={
          <>
            <ProcurementOutletSelector
              ownerMode={ownerMode}
              value={selectedOutletId}
              onChange={setSelectedOutletId}
              outlets={activeOutlets}
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            >
              <option value="all">Semua status</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially paid</option>
              <option value="paid">Paid</option>
            </select>
            <Link
              to="/supplier-debts/payments"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-brand-500/10"
            >
              <DocsIcon className="h-4 w-4" />
              Histori pembayaran
            </Link>
          </>
        }
      >
        {isLoading ? (
          <AppLoader label="Memuat daftar utang supplier..." />
        ) : shouldShowOutletPrompt ? (
          <div className="p-6">
            <PagePlaceholder
              title="Pilih outlet procurement terlebih dahulu"
              description="Owner perlu memilih outlet aktif sebelum memuat daftar utang dan histori pembayaran supplier."
              status="Outlet required"
            />
          </div>
        ) : debts.length === 0 ? (
          <div className="p-6">
            <PagePlaceholder
              title="Belum ada utang supplier"
              description="Belum ada purchase order tempo yang membentuk utang pada outlet ini."
              status="Empty"
            />
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {debts.map((debt) => (
                <li key={debt.id} className="flex flex-col gap-4 px-5 py-5 transition hover:bg-gray-50/80 dark:hover:bg-white/[0.02] xl:flex-row xl:items-center sm:px-6">
                  <div className="flex min-w-0 flex-1 items-center gap-3"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${accentFor(debt.supplierName)}`}>{debt.supplierName.trim().charAt(0).toUpperCase()}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{debt.supplierName}</p><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getDebtStatusClasses(debt.status)}`}>{debt.status}</span></div><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{debt.poNumber} · Jatuh tempo {formatDateOnly(debt.dueDate)}</p></div></div>
                  <div className="grid gap-3 pl-15 sm:grid-cols-3 xl:min-w-[44%] xl:pl-0"><div><p className="text-[11px] uppercase tracking-wider text-gray-400">Nilai utang</p><p className="mt-1 text-sm text-gray-700 dark:text-gray-200">{formatCurrency(debt.amount)}</p></div><div><p className="text-[11px] uppercase tracking-wider text-gray-400">Terbayar</p><p className="mt-1 text-sm text-success-600 dark:text-success-300">{formatCurrency(debt.paidAmount)}</p></div><div><p className="text-[11px] uppercase tracking-wider text-gray-400">Sisa</p><p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(debt.remainingAmount)}</p></div></div>
                  <div className="flex gap-2 pl-15 xl:pl-0">
                      <button
                        type="button"
                        onClick={() => setDetailPoId(debt.purchaseOrderId)}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-brand-50 hover:text-brand-600 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-brand-500/10"
                      >
                        Detail
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayTarget(debt)}
                        disabled={debt.status === "paid"}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
                      >
                        <DollarLineIcon className="h-3.5 w-3.5" />
                        Bayar
                      </button>
                    </div>
                </li>
              ))}
          </ul>
        )}
      </AppTableShell>

      <Modal isOpen={Boolean(detailPoId)} onClose={() => setDetailPoId(null)} className="max-w-2xl p-6 sm:p-8">
        <div className="space-y-5">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Detail utang supplier</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Ringkasan tagihan supplier berdasarkan purchase order yang dipilih.
            </p>
          </div>
          {isLoadingDetail ? (
            <AppLoader label="Memuat detail utang..." />
          ) : detailDebt ? (
            <div className="grid gap-4 rounded-2xl border border-gray-200 p-4 text-sm dark:border-gray-800 md:grid-cols-2">
              <div>
                <p className="text-gray-500">Supplier</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{detailDebt.supplierName}</p>
              </div>
              <div>
                <p className="text-gray-500">No. PO</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{detailDebt.poNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Jatuh tempo</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{formatDateOnly(detailDebt.dueDate)}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{detailDebt.status}</p>
              </div>
              <div>
                <p className="text-gray-500">Nilai utang</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{formatCurrency(detailDebt.amount)}</p>
              </div>
              <div>
                <p className="text-gray-500">Terbayar</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{formatCurrency(detailDebt.paidAmount)}</p>
              </div>
              {detailDebt.soldAmount !== undefined && (
                <div>
                  <p className="text-gray-500">Total barang laku</p>
                  <p className="mt-1 font-medium text-gray-900 dark:text-white">{formatCurrency(detailDebt.soldAmount)}</p>
                </div>
              )}
              {detailDebt.maxPayableAmount !== undefined && (
                <div>
                  <p className="text-gray-500">Maksimum pembayaran saat ini</p>
                  <p className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(detailDebt.maxPayableAmount)}</p>
                </div>
              )}
              <div className="md:col-span-2">
                <p className="text-gray-500">Sisa utang</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(detailDebt.remainingAmount)}</p>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      <PaySupplierDebtModal
        open={Boolean(payTarget)}
        debt={payTarget}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onClose={() => {
          if (!isSubmitting) {
            setPayTarget(null);
            setSubmitError(null);
          }
        }}
        onSubmit={handlePayDebt}
      />
    </ProtectedPageShell>
  );
}

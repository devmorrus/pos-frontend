import { useEffect, useState } from "react";
import { Link } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { CheckCircleIcon, DollarLineIcon, UserIcon } from "../../../icons";
import { accentFor } from "../../../utils/accent";
import ProcurementOutletSelector from "../../procurement/components/ProcurementOutletSelector";
import { useProcurementOutletScope } from "../../procurement/hooks/useProcurementOutletScope";
import { formatCurrency, formatDateTime } from "../../procurement/utils/formatters";
import { getSupplierPayments } from "../api/debtsApi";
import type { SupplierPaymentDto } from "../types/debt";

export default function SupplierDebtPaymentsPage() {
  const { ownerMode, activeOutlets, effectiveOutletId, selectedOutletId, setSelectedOutletId } =
    useProcurementOutletScope();
  const [payments, setPayments] = useState<SupplierPaymentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadPayments() {
    if (!effectiveOutletId) {
      setPayments([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setPayments(await getSupplierPayments({ outletId: effectiveOutletId }));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat histori pembayaran supplier."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPayments();
  }, [effectiveOutletId]);

  const shouldShowOutletPrompt = ownerMode && !effectiveOutletId;
  const totalPaid = payments.reduce((total, payment) => total + payment.amount, 0);

  return (
    <ProtectedPageShell
      title="Histori Pembayaran Supplier"
      description="Lihat seluruh pembayaran utang supplier terbaru per outlet procurement aktif."
    >
      <InlineAlert tone="error" message={error} />

      <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-brand-50 via-white to-white p-6 shadow-theme-xs dark:border-gray-800 dark:from-brand-500/10 dark:via-gray-900 dark:to-gray-900 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-success-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-success-500 to-emerald-700 text-white shadow-lg shadow-success-500/25"><CheckCircleIcon className="h-8 w-8" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-success-600 dark:text-success-300">Payment tracking</p><h3 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">Histori pembayaran supplier</h3><p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Semua pembayaran tercatat rapi dan mudah ditelusuri.</p></div></div><div className="rounded-2xl border border-success-100 bg-white/80 px-5 py-4 dark:border-success-500/20 dark:bg-gray-900/70"><p className="text-xs uppercase tracking-wider text-gray-500">Total pembayaran</p><p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalPaid)}</p><p className="text-xs text-gray-500 dark:text-gray-400">{payments.length} transaksi</p></div></div>
      </section>

      <AppTableShell
        title="Histori pembayaran"
        description={`${payments.length} transaksi pembayaran pada outlet aktif`}
        actions={
          <>
            <ProcurementOutletSelector
              ownerMode={ownerMode}
              value={selectedOutletId}
              onChange={setSelectedOutletId}
              outlets={activeOutlets}
            />
            <Link
              to="/supplier-debts"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-brand-500/10"
            >
              <DollarLineIcon className="h-4 w-4" />
              Kembali ke utang
            </Link>
          </>
        }
      >
        {isLoading ? (
          <AppLoader label="Memuat histori pembayaran supplier..." />
        ) : shouldShowOutletPrompt ? (
          <div className="p-6">
            <PagePlaceholder
              title="Pilih outlet procurement terlebih dahulu"
              description="Owner perlu memilih outlet aktif sebelum memuat histori pembayaran supplier."
              status="Outlet required"
            />
          </div>
        ) : payments.length === 0 ? (
          <div className="p-6">
            <PagePlaceholder
              title="Belum ada histori pembayaran"
              description="Belum ada pembayaran utang supplier pada outlet procurement aktif."
              status="Empty"
            />
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {payments.map((payment) => (
                <li key={payment.id} className="flex flex-col gap-4 px-5 py-5 transition hover:bg-gray-50/80 dark:hover:bg-white/[0.02] xl:flex-row xl:items-center sm:px-6"><div className="flex min-w-0 flex-1 items-center gap-3"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${accentFor(payment.supplierName)}`}>{payment.supplierName.trim().charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{payment.supplierName}</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{payment.poNumber} · {formatDateTime(payment.paymentDate)}</p></div></div><div className="grid gap-3 pl-15 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-3 xl:min-w-[48%] xl:pl-0"><span className="inline-flex items-center gap-2"><UserIcon className="h-4 w-4 text-brand-500" />{payment.paymentMethod}</span><span>{payment.referenceNumber ?? "Tanpa referensi"}</span><span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(payment.amount)}</span></div><span className="w-fit rounded-full bg-success-50 px-3 py-1 text-xs font-semibold text-success-700 dark:bg-success-500/10 dark:text-success-300">{payment.status}</span></li>
              ))}
          </ul>
        )}
      </AppTableShell>
    </ProtectedPageShell>
  );
}

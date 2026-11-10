import { useEffect, useState } from "react";
import { Link } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppErrorState, AppLoader, InlineAlert } from "../../../components/ui";
import { useAuth } from "../../auth/hooks/useAuth";
import { isOwner } from "../../auth/utils/access";
import { useOutlet } from "../../outlets/hooks/useOutlet";
import { getErrorMessage } from "../../../utils/errors";
import { getRecentTransactions } from "../api/transactionsApi";
import type { TransactionListItemDto } from "../types/transaction";
import {
  formatCurrency,
  formatDateTime,
} from "../utils/formatters";
import TransactionStatusBadge from "../components/TransactionStatusBadge";
import { ArrowRightIcon, DocsIcon, TimeIcon } from "../../../icons";

export default function TransactionsPage() {
  const { session } = useAuth();
  const { selectedOutletId } = useOutlet();
  const [transactions, setTransactions] = useState<TransactionListItemDto[]>([]);
  const ownerMode = isOwner(session?.role);
  const effectiveOutletId = ownerMode ? selectedOutletId : session?.outletId ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTransactions() {
      if (!effectiveOutletId) {
        setTransactions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        setTransactions(await getRecentTransactions(effectiveOutletId, 20));
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat histori transaksi."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadTransactions();
  }, [effectiveOutletId]);

  return (
    <ProtectedPageShell
      title="Transaksi"
      description="Pantau riwayat penjualan, pembayaran, dan aktivitas kasir di outlet Anda."
    >
      <InlineAlert tone="error" message={error} />

      <section className="relative overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white p-6 shadow-theme-xs dark:border-[#293b58] dark:from-[#172554] dark:via-[#1e1b4b] dark:to-[#111b2c] sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/20">
              <DocsIcon className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Riwayat penjualan</p>
              <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Setiap transaksi, tercatat rapi</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-300">Tinjau transaksi terbaru dan telusuri rincian penjualan serta pembayaran dalam satu tempat.</p>
            </div>
          </div>
          <div className="shrink-0 rounded-2xl border border-brand-100 bg-white/70 px-5 py-4 dark:border-white/10 dark:bg-white/5">
            <p className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400"><TimeIcon className="h-4 w-4" aria-hidden="true" />Transaksi ditampilkan</p>
            <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{isLoading ? "—" : transactions.length}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Maksimal 20 transaksi terbaru per outlet</p>
          </div>
        </div>
      </section>

      <AppTableShell
        title="Histori transaksi terbaru"
        description="Riwayat penjualan di outlet aktif. Pilih Detail untuk melihat rincian transaksi."
      >
        {!effectiveOutletId && ownerMode ? (
          <AppErrorState
            title="Outlet kerja belum dipilih"
            description="Pilih outlet aktif terlebih dahulu untuk melihat histori transaksi kasir."
            fullScreen={false}
          />
        ) : isLoading ? (
          <AppLoader label="Memuat histori transaksi..." />
        ) : transactions.length === 0 ? (
          <AppErrorState
            title="Belum ada transaksi"
            description="Belum ada transaksi yang tercatat untuk outlet ini."
            fullScreen={false}
          />
        ) : (
          <table className="min-w-[960px] w-full divide-y divide-gray-200 dark:divide-gray-800">
            <caption className="sr-only">Daftar 20 transaksi terbaru pada outlet aktif</caption>
            <thead className="bg-gray-50 dark:bg-[#0b1422]">
              <tr>
                {["Transaksi", "Kasir & Pelanggan", "Pembayaran", "Total", "Status", "Aksi"].map(
                  (column) => (
                    <th
                      key={column}
                      scope="col"
                      className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      {column}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="transition-colors hover:bg-brand-50/40 dark:hover:bg-white/[0.025]">
                  <td className="px-5 py-5 text-sm text-gray-900 dark:text-white">
                    <p className="whitespace-nowrap font-semibold">{transaction.transactionNumber}</p>
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{formatDateTime(transaction.createdAt)}</p>
                  </td>
                  <td className="px-5 py-5 text-sm text-gray-600 dark:text-gray-300">
                    <p className="font-medium text-gray-900 dark:text-white">{transaction.userName}</p>
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{transaction.customerName ?? (transaction.customerType === "guest" ? "Guest" : transaction.externalCustomerReference ?? "-")}</p>
                  </td>
                  <td className="px-5 py-5 text-sm text-gray-600 dark:text-gray-300">
                    <p className="font-medium">{transaction.paymentSummary}</p>
                    <span className="mt-1.5 inline-flex rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-800 dark:text-gray-400">{transaction.channel}</span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-5 text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(transaction.grandTotal)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-5">
                    <TransactionStatusBadge status={transaction.status} />
                  </td>
                  <td className="px-5 py-5">
                    <Link
                      to={`/transactions/${transaction.id}`}
                      aria-label={`Lihat detail transaksi ${transaction.transactionNumber}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-600 transition hover:border-brand-300 hover:bg-brand-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20"
                    >
                      Detail
                      <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AppTableShell>
    </ProtectedPageShell>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppErrorState, AppLoader, InlineAlert } from "../../../components/ui";
import { useAuth } from "../../auth/hooks/useAuth";
import { isOwner } from "../../auth/utils/access";
import { getOutlets } from "../../outlets/api/outletsApi";
import type { OutletLookupDto } from "../../outlets/types/outlet";
import { useOutlet } from "../../outlets/hooks/useOutlet";
import { getErrorMessage } from "../../../utils/errors";
import { getRecentTransactions } from "../api/transactionsApi";
import type { TransactionListItemDto } from "../types/transaction";
import {
  formatCurrency,
  formatDateTime,
} from "../utils/formatters";
import TransactionStatusBadge from "../components/TransactionStatusBadge";

export default function TransactionsPage() {
  const { session } = useAuth();
  const { selectedOutletId, setSelectedOutletId } = useOutlet();
  const [transactions, setTransactions] = useState<TransactionListItemDto[]>([]);
  const [outlets, setOutlets] = useState<OutletLookupDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ownerMode = isOwner(session?.role);
  const activeOutlets = useMemo(
    () => outlets.filter((outlet) => outlet.isActive),
    [outlets],
  );
  const effectiveOutletId = ownerMode ? selectedOutletId : session?.outletId ?? null;

  useEffect(() => {
    async function loadOutletsIfNeeded() {
      if (!ownerMode) {
        return;
      }

      try {
        setOutlets(await getOutlets());
      } catch {
        // best-effort only; main error comes from list loading
      }
    }

    void loadOutletsIfNeeded();
  }, [ownerMode]);

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
      description="Histori transaksi terbaru per outlet untuk kebutuhan audit operasional kasir fase 3."
    >
      <InlineAlert tone="error" message={error} />

      <AppTableShell
        title="Histori transaksi terbaru"
        description="Daftar ini memakai endpoint histori dasar backend dan dibatasi ke outlet operasional yang aktif."
        actions={
          ownerMode ? (
            <select
              value={selectedOutletId ?? ""}
              onChange={(event) => setSelectedOutletId(event.target.value || null)}
              className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            >
              <option value="">Pilih outlet</option>
              {activeOutlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
          ) : null
        }
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
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                {["Nomor", "Waktu", "Kasir", "Customer", "Metode", "Channel", "Total", "Status", "Aksi"].map(
                  (column) => (
                    <th
                      key={column}
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500"
                    >
                      {column}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {transaction.transactionNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {formatDateTime(transaction.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {transaction.userName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {transaction.customerName ?? (transaction.customerType === "guest" ? "Guest" : transaction.externalCustomerReference ?? "-")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {transaction.paymentSummary}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {transaction.channel}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(transaction.grandTotal)}
                  </td>
                  <td className="px-6 py-4">
                    <TransactionStatusBadge status={transaction.status} />
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/transactions/${transaction.id}`}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                    >
                      Detail
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

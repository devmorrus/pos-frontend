import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppErrorState, AppLoader, InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { getCustomerById, getCustomerTransactions } from "../api/customersApi";
import type { CustomerDto } from "../types/customer";
import type { TransactionListItemDto } from "../../transactions/types/transaction";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("id-ID") : "-";
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDto | null>(null);
  const [transactions, setTransactions] = useState<TransactionListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPage() {
      if (!id) {
        setError("ID customer tidak valid.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [customerResult, transactionsResult] = await Promise.all([
          getCustomerById(id),
          getCustomerTransactions(id, 20),
        ]);
        setCustomer(customerResult);
        setTransactions(transactionsResult);
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat detail customer."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadPage();
  }, [id]);

  return (
    <ProtectedPageShell
      title="Detail Customer"
      description="Ringkasan profil customer, status member dasar, dan histori transaksi yang terhubung."
    >
      <InlineAlert tone="error" message={error} />

      {isLoading ? (
        <AppLoader label="Memuat detail customer..." />
      ) : !customer ? (
        <AppErrorState
          title="Customer tidak ditemukan"
          description="Data customer yang diminta belum tersedia atau tidak bisa diakses."
          actionLabel="Kembali ke daftar customer"
          actionHref="/customers"
          fullScreen={false}
        />
      ) : (
        <div className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">{customer.customerCode}</p>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{customer.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{customer.phone} {customer.email ? `· ${customer.email}` : ""}</p>
              </div>
              <div className="flex items-center gap-3">
                <Link to={`/customers/${customer.id}/edit`} className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 dark:border-brand-500/20 dark:text-brand-300">Edit</Link>
                <Link to="/customers" className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-800 dark:text-gray-200">Kembali</Link>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Status member</h4>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-gray-500 dark:text-gray-400">Status</dt><dd className="font-medium text-gray-900 dark:text-white">{customer.memberStatus}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-gray-500 dark:text-gray-400">Aktif</dt><dd className="font-medium text-gray-900 dark:text-white">{customer.isActive ? "Ya" : "Tidak"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-gray-500 dark:text-gray-400">Joined</dt><dd className="font-medium text-gray-900 dark:text-white">{formatDate(customer.joinedAt)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-gray-500 dark:text-gray-400">Last transaction</dt><dd className="font-medium text-gray-900 dark:text-white">{formatDate(customer.lastTransactionAt)}</dd></div>
              </dl>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Nilai customer</h4>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-gray-500 dark:text-gray-400">Lifetime spend</dt><dd className="font-medium text-gray-900 dark:text-white">{formatCurrency(customer.lifetimeSpend)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-gray-500 dark:text-gray-400">Points balance</dt><dd className="font-medium text-gray-900 dark:text-white">{customer.pointsBalance}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-gray-500 dark:text-gray-400">Birth date</dt><dd className="font-medium text-gray-900 dark:text-white">{customer.birthDate ? customer.birthDate.slice(0, 10) : "-"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-gray-500 dark:text-gray-400">Gender</dt><dd className="font-medium text-gray-900 dark:text-white">{customer.gender ?? "-"}</dd></div>
              </dl>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Catatan</h4>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{customer.notes ?? "Belum ada catatan untuk customer ini."}</p>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Histori transaksi</h4>
            {transactions.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Belum ada transaksi yang terhubung ke customer ini.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-950">
                    <tr>
                      {["Nomor", "Tanggal", "Outlet", "Kasir", "Total", "Aksi"].map((column) => (
                        <th key={column} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{transaction.transactionNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{formatDate(transaction.createdAt)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{transaction.outletName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{transaction.userName}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.grandTotal)}</td>
                        <td className="px-4 py-3">
                          <Link to={`/transactions/${transaction.id}`} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200">Detail</Link>
                        </td>
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

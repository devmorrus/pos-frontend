import { useEffect, useState } from "react";
import { Link } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppErrorState, AppLoader, InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { getCustomers } from "../api/customersApi";
import type { CustomerListItemDto } from "../types/customer";

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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerListItemDto[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomers() {
      setIsLoading(true);
      setError(null);

      try {
        setCustomers(await getCustomers({
          q: query || undefined,
          isActive: status === "all" ? undefined : status === "active",
          take: 100,
        }));
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat daftar customer."));
      } finally {
        setIsLoading(false);
      }
    }

    const timeoutId = window.setTimeout(() => {
      void loadCustomers();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [query, status]);

  return (
    <ProtectedPageShell
      title="Customers"
      description="Kelola customer dan member dasar yang bisa dipakai kasir untuk attach transaksi POS."
    >
      <InlineAlert tone="error" message={error} />

      <AppTableShell
        title="Master customer"
        description="Lookup utama menggunakan nomor HP, dengan histori belanja dasar untuk kebutuhan repeat customer."
        actions={
          <>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama, HP, atau kode member"
              className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            >
              <option value="all">Semua status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
            <Link
              to="/customers/create"
              className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Tambah customer
            </Link>
          </>
        }
      >
        {isLoading ? (
          <AppLoader label="Memuat daftar customer..." />
        ) : customers.length === 0 ? (
          <AppErrorState
            title="Belum ada customer"
            description="Customer belum tersedia untuk filter yang sedang dipilih."
            fullScreen={false}
          />
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                {["Kode", "Nama", "HP", "Email", "Status", "Last Transaction", "Lifetime Spend", "Aksi"].map((column) => (
                  <th
                    key={column}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{customer.customerCode}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{customer.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{customer.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{customer.email ?? "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${customer.isActive ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>
                      {customer.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{formatDate(customer.lastTransactionAt)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(customer.lifetimeSpend)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/customers/${customer.id}`}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                      >
                        Detail
                      </Link>
                      <Link
                        to={`/customers/${customer.id}/edit`}
                        className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 dark:border-brand-500/20 dark:text-brand-300"
                      >
                        Edit
                      </Link>
                    </div>
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

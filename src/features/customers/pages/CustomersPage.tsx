import { useEffect, useState } from "react";
import { Link } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, InlineAlert } from "../../../components/ui";
import { GroupIcon, PlusIcon, UserCircleIcon } from "../../../icons";
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
      description="Kelola profil pelanggan, informasi kontak, dan riwayat belanja dalam satu tempat."
    >
      <InlineAlert tone="error" message={error} />

      <section className="relative overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white p-6 shadow-theme-xs dark:border-[#293b58] dark:from-[#172554] dark:via-[#1e1b4b] dark:to-[#111b2c] sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/20"><GroupIcon className="h-7 w-7" aria-hidden="true" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Hubungan pelanggan</p><h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Kenali pelanggan, tingkatkan pelayanan</h2><p className="mt-2 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-300">Simpan informasi pelanggan dan pantau aktivitas belanja untuk membangun hubungan yang lebih baik.</p></div></div>
          <div className="shrink-0 rounded-2xl border border-brand-100 bg-white/70 px-5 py-4 dark:border-white/10 dark:bg-white/5"><p className="text-xs text-gray-500 dark:text-gray-400">Pelanggan ditampilkan</p><p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{isLoading ? "—" : customers.length}</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Sesuai pencarian dan filter · Maks. 100</p></div>
        </div>
      </section>

      <AppTableShell
        title="Daftar pelanggan"
        description="Temukan pelanggan melalui nama, nomor HP, atau kode member."
        actions={
          <>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama, HP, atau kode member"
              aria-label="Cari pelanggan"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white sm:w-64"
            />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter status pelanggan"
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white"
            >
              <option value="all">Semua status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
            <Link
              to="/customers/create"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              <PlusIcon className="h-4 w-4" aria-hidden="true" />Tambah customer
            </Link>
          </>
        }
      >
        {isLoading ? (
          <AppLoader label="Memuat daftar customer..." />
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center"><div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-300"><UserCircleIcon className="h-8 w-8" aria-hidden="true" /></div><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Belum ada pelanggan yang ditampilkan</h3><p className="mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">Coba sesuaikan pencarian atau filter status. Anda juga dapat menambahkan profil pelanggan baru melalui tombol Tambah customer.</p></div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                {["Kode", "Nama", "HP", "Email", "Status", "Transaksi terakhir", "Total belanja", "Aksi"].map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {customers.map((customer) => (
                <tr key={customer.id} className="transition hover:bg-brand-50/40 dark:hover:bg-white/[0.025]">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{customer.customerCode}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white"><div className="flex items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300" aria-hidden="true">{customer.name.substring(0, 1).toUpperCase()}</div>{customer.name}</div></td>
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

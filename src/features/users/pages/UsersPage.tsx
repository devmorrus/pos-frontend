import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import {
  AppLoader,
  ConfirmDialog,
  InlineAlert,
  PagePlaceholder,
} from "../../../components/ui";
import { isOwner } from "../../auth";
import { getOutlets } from "../../outlets/api/outletsApi";
import type { OutletLookupDto } from "../../outlets/types/outlet";
import { useAuth } from "../../auth/hooks/useAuth";
import { deleteUser, getUsers } from "../api/usersApi";
import type { UserDto } from "../types/user";
import { GroupIcon, LockIcon, PencilIcon, PlusIcon, TrashBinIcon, UserCircleIcon } from "../../../icons";

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("id-ID");
}

export default function UsersPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [outlets, setOutlets] = useState<OutletLookupDto[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const ownerMode = isOwner(session?.role);

  async function loadData() {
    setIsLoading(true);
    setError(null);

    try {
      const [usersResult, outletsResult] = await Promise.all([
        getUsers(ownerMode && selectedOutletId ? selectedOutletId : undefined),
        ownerMode || session?.role === "Admin" ? getOutlets() : Promise.resolve([]),
      ]);

      setUsers(usersResult);
      setOutlets(outletsResult);
    } catch (requestError) {
      const message =
        typeof requestError === "object" &&
        requestError &&
        "message" in requestError &&
        typeof requestError.message === "string"
          ? requestError.message
          : "Gagal memuat data pengguna.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [selectedOutletId]);

  const outletNameById = useMemo(
    () =>
      new Map(outlets.map((outlet) => [outlet.id, outlet.name])),
    [outlets],
  );

  async function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteUser(deleteTarget.id);
      setSuccessMessage(`Pengguna ${deleteTarget.name} berhasil dihapus.`);
      setDeleteTarget(null);
      await loadData();
    } catch (requestError) {
      const message =
        typeof requestError === "object" &&
        requestError &&
        "message" in requestError &&
        typeof requestError.message === "string"
          ? requestError.message
          : "Gagal menghapus pengguna.";
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Pengguna"
      description="Kelola akun staf MorrusPOS, atur hak akses berdasarkan peran (role), dan batasi akses data sesuai dengan outlet yang ditentukan."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      <section className="rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white p-6 dark:border-[#293b58] dark:from-[#172554] dark:via-[#1e1b4b] dark:to-[#111b2c] sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/20"><GroupIcon className="h-7 w-7" aria-hidden="true" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Tim & hak akses</p>
              <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Kelola tim dalam satu tempat</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-300">Atur akun staf, tentukan peran, dan pastikan setiap anggota tim terhubung dengan outlet yang tepat.</p>
            </div>
          </div>
          <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-brand-200 bg-white/60 px-4 py-2 text-xs font-semibold text-brand-700 dark:border-white/10 dark:bg-white/5 dark:text-brand-200"><LockIcon className="h-4 w-4" aria-hidden="true" />Akses sesuai peran</span>
        </div>
      </section>

      <AppTableShell
        title="Daftar pengguna"
        description="Owner dapat melihat seluruh outlet, sedangkan Admin dibatasi ke outlet miliknya."
        actions={
          <>
            {ownerMode ? (
              <select
                aria-label="Filter pengguna berdasarkan outlet"
                value={selectedOutletId}
                onChange={(event) => setSelectedOutletId(event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white sm:w-auto"
              >
                <option value="">Semua outlet</option>
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </select>
            ) : null}
            <Link
              to="/users/create"
              className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              <PlusIcon className="h-5 w-5" aria-hidden="true" />
              Tambah pengguna
            </Link>
          </>
        }
      >
        {isLoading ? (
          <AppLoader label="Memuat daftar pengguna..." />
        ) : users.length === 0 ? (
          <div className="p-6">
            <PagePlaceholder
              title="Belum ada pengguna"
              description="Data pengguna belum tersedia untuk filter outlet yang sedang dipilih."
              status="Empty"
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-[#111b2c]">
              <tr>
                {["Pengguna", "Peran", "Outlet", "Status", "Login terakhir", "Aksi"].map(
                  (column) => (
                    <th
                      key={column}
                      scope="col"
                      className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      {column}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {users.map((user) => {
                const isSelf = user.id === session?.userId;

                return (
                  <tr key={user.id} className="transition hover:bg-gray-50/80 dark:hover:bg-white/[0.02]">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"><UserCircleIcon className="h-6 w-6" aria-hidden="true" /></div>
                        <div className="min-w-48">
                          <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-gray-900 dark:text-white">{user.name}</span>{isSelf && <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">Anda</span>}</div>
                          <p className="mt-1 break-all text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300"><LockIcon className="h-3.5 w-3.5" aria-hidden="true" />{user.roleName}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {user.outletName ?? (user.outletId ? outletNameById.get(user.outletId) : "Semua outlet") ?? "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                          user.isActive
                            ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                        {user.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(user.lastLoginAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <Link
                          to={`/users/${user.id}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-brand-400 hover:text-brand-600 dark:border-gray-700 dark:text-gray-200 dark:hover:text-brand-300"
                        >
                          <PencilIcon className="h-4 w-4" aria-hidden="true" />
                          Edit
                        </Link>
                        {isSelf ? (
                          <Link
                            to="/profile/change-password"
                            className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 dark:border-brand-500/20 dark:text-brand-300 dark:hover:bg-brand-500/10"
                          >
                            Password saya
                          </Link>
                        ) : null}
                        {!isSelf ? (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(user)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-error-200 px-3 py-2 text-xs font-semibold text-error-700 transition hover:bg-error-50 dark:border-error-500/20 dark:text-error-300 dark:hover:bg-error-500/10"
                          >
                            <TrashBinIcon className="h-4 w-4" aria-hidden="true" />
                            Hapus
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </AppTableShell>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus pengguna"
        description={`Anda yakin ingin menghapus akun ${deleteTarget?.name ?? ""}? Tindakan ini tidak dapat dibatalkan melalui halaman ini.`}
        confirmLabel="Hapus pengguna"
        isBusy={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </ProtectedPageShell>
  );
}

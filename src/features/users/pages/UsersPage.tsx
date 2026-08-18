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

      <AppTableShell
        title="Daftar pengguna"
        description="Owner dapat melihat seluruh outlet, sedangkan Admin dibatasi ke outlet miliknya."
        actions={
          <>
            {ownerMode ? (
              <select
                value={selectedOutletId}
                onChange={(event) => setSelectedOutletId(event.target.value)}
                className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
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
              className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
            >
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
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                {["Nama", "Email", "Role", "Outlet", "Status", "Last Login", "Aksi"].map(
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
              {users.map((user) => {
                const isSelf = user.id === session?.userId;

                return (
                  <tr key={user.id} className="align-top">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {user.roleName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {user.outletName ?? (user.outletId ? outletNameById.get(user.outletId) : "Semua outlet") ?? "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.isActive
                            ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {user.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(user.lastLoginAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/users/${user.id}/edit`}
                          className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                        >
                          Edit
                        </Link>
                        {isSelf ? (
                          <Link
                            to="/profile/change-password"
                            className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 dark:border-brand-500/20 dark:text-brand-300"
                          >
                            Password saya
                          </Link>
                        ) : null}
                        {!isSelf ? (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(user)}
                            className="rounded-xl border border-error-200 px-3 py-2 text-xs font-semibold text-error-700 dark:border-error-500/20 dark:text-error-300"
                          >
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
        description={`Anda yakin ingin menghapus akun ${deleteTarget?.name ?? ""}? Tindakan ini tidak dapat dibatalkan dari UI.`}
        confirmLabel="Hapus pengguna"
        isBusy={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </ProtectedPageShell>
  );
}

import { useEffect, useMemo, useState } from "react";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { useAuth } from "../../auth/hooks/useAuth";
import { isOwner } from "../../auth/utils/access";
import { getErrorMessage } from "../../../utils/errors";
import {
  createOutlet,
  getOutlets,
  updateOutlet,
} from "../api/outletsApi";
import OutletFormModal from "../components/OutletFormModal";
import type { OutletDto, OutletFormValues } from "../types/outlet";

type ModalState =
  | { open: false; mode: "create"; outlet: null }
  | { open: true; mode: "create"; outlet: null }
  | { open: true; mode: "edit"; outlet: OutletDto };

function formatDate(value: string) {
  return new Date(value).toLocaleString("id-ID");
}

export default function OutletsPage() {
  const { session } = useAuth();
  const [outlets, setOutlets] = useState<OutletDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState>({
    open: false,
    mode: "create",
    outlet: null,
  });

  const ownerMode = isOwner(session?.role);

  async function loadOutlets() {
    setIsLoading(true);
    setError(null);

    try {
      setOutlets(await getOutlets());
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat daftar cabang."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadOutlets();
  }, []);

  const sortedOutlets = useMemo(
    () => [...outlets].sort((left, right) => left.name.localeCompare(right.name, "id-ID")),
    [outlets],
  );

  function openCreateModal() {
    setSubmitError(null);
    setModalState({ open: true, mode: "create", outlet: null });
  }

  function openEditModal(outlet: OutletDto) {
    setSubmitError(null);
    setModalState({ open: true, mode: "edit", outlet });
  }

  function closeModal() {
    if (isSubmitting) {
      return;
    }

    setModalState({ open: false, mode: "create", outlet: null });
    setSubmitError(null);
  }

  async function handleSubmit(values: OutletFormValues) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (modalState.mode === "create") {
        await createOutlet({
          code: values.code,
          name: values.name,
          address: values.address || null,
          phone: values.phone || null,
        });
        setSuccessMessage(`Cabang ${values.name} berhasil dibuat.`);
      } else {
        await updateOutlet(modalState.outlet.id, {
          code: values.code,
          name: values.name,
          address: values.address || null,
          phone: values.phone || null,
          isActive: values.isActive,
        });
        setSuccessMessage(`Cabang ${values.name} berhasil diperbarui.`);
      }

      closeModal();
      await loadOutlets();
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError, "Gagal menyimpan cabang."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Cabang"
      description="Kelola outlet MorrusPOS untuk kebutuhan multi-cabang, penugasan user, dan konteks stok per outlet."
    >
      {!ownerMode ? (
        <InlineAlert
          tone="info"
          message="Admin hanya dapat melihat daftar cabang. Tambah dan edit cabang dibatasi untuk Owner."
        />
      ) : null}
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      <AppTableShell
        title="Daftar cabang"
        description="Cabang nonaktif tetap dipertahankan agar histori bisnis dan relasi data tidak hilang."
        actions={
          ownerMode ? (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Tambah cabang
            </button>
          ) : null
        }
      >
        {isLoading ? (
          <AppLoader label="Memuat daftar cabang..." />
        ) : sortedOutlets.length === 0 ? (
          <div className="p-6">
            <PagePlaceholder
              title="Belum ada cabang"
              description="Tambahkan cabang pertama untuk mulai mengelola outlet dan stok per lokasi."
              status="Empty"
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                {["Kode", "Nama", "Alamat", "Telepon", "Status", "Diupdate", "Aksi"].map(
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
              {sortedOutlets.map((outlet) => (
                <tr key={outlet.id} className="align-top">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {outlet.code}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                    {outlet.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {outlet.address ?? "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {outlet.phone ?? "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        outlet.isActive
                          ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {outlet.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(outlet.updatedAt)}
                  </td>
                  <td className="px-6 py-4">
                    {ownerMode ? (
                      <button
                        type="button"
                        onClick={() => openEditModal(outlet)}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                      >
                        Edit
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Read-only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AppTableShell>

      <OutletFormModal
        open={modalState.open}
        mode={modalState.mode}
        outlet={modalState.outlet}
        existingCodes={outlets.map((o) => o.code)}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </ProtectedPageShell>
  );
}

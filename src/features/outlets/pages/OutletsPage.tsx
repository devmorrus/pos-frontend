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
import { Link } from "react-router";
import { GridIcon, InfoIcon, PencilIcon, PlusIcon } from "../../../icons";

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
      description="Kelola informasi cabang, penugasan tim, dan pengaturan outlet untuk operasional bisnis Anda."
    >
      {!ownerMode ? (
        <InlineAlert
          tone="info"
          message="Admin hanya dapat melihat daftar cabang. Tambah dan edit cabang dibatasi untuk Owner."
        />
      ) : null}
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      <section className="rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white p-6 dark:border-[#293b58] dark:from-[#172554] dark:via-[#1e1b4b] dark:to-[#111b2c] sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/20"><GridIcon className="h-7 w-7" aria-hidden="true" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Jaringan cabang</p>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Semua cabang, satu pengelolaan</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">Rapikan informasi lokasi dan kontak, kelola status cabang, serta sesuaikan fitur untuk kebutuhan setiap outlet.</p>
          </div>
        </div>
      </section>

      <AppTableShell
        title="Daftar cabang"
        description="Cabang nonaktif tetap dipertahankan agar histori bisnis dan relasi data tidak hilang."
        actions={
          ownerMode ? (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              <PlusIcon className="h-5 w-5" aria-hidden="true" />
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
            <thead className="bg-gray-50 dark:bg-[#111b2c]">
              <tr>
                {["Cabang", "Alamat", "Telepon", "Status", "Diperbarui", "Aksi"].map(
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
              {sortedOutlets.map((outlet) => (
                <tr key={outlet.id} className="transition hover:bg-gray-50/80 dark:hover:bg-white/[0.02]">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"><GridIcon className="h-5 w-5" aria-hidden="true" /></div>
                      <div className="min-w-40"><p className="text-sm font-semibold text-gray-900 dark:text-white">{outlet.name}</p><p className="mt-1 font-mono text-xs tracking-wide text-gray-500 dark:text-gray-400">{outlet.code}</p></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {outlet.address ?? "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {outlet.phone ?? "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                        outlet.isActive
                          ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                      {outlet.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(outlet.updatedAt)}
                  </td>
                  <td className="px-6 py-4">
                    {ownerMode ? (
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditModal(outlet)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-brand-400 hover:text-brand-600 dark:border-gray-700 dark:text-gray-200 dark:hover:text-brand-300"
                        >
                          <PencilIcon className="h-4 w-4" aria-hidden="true" />
                          Edit
                        </button>
                        <Link
                          to={`/settings/capabilities?outletId=${outlet.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20"
                        >
                          <GridIcon className="h-4 w-4" aria-hidden="true" />
                          Atur fitur
                        </Link>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">Hanya lihat</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AppTableShell>

      <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-[#293b58] dark:bg-[#111b2c]">
        <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-500 dark:text-brand-300" aria-hidden="true" />
        <p className="text-xs leading-6 text-gray-600 dark:text-gray-400">Cabang tidak perlu dihapus saat berhenti beroperasi. Nonaktifkan melalui menu Edit agar histori transaksi dan data bisnis tetap tersimpan.</p>
      </div>

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

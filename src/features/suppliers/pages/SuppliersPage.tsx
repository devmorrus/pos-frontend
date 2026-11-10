import { useEffect, useMemo, useState } from "react";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, ConfirmDialog, InlineAlert } from "../../../components/ui";
import {
  BoxIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  GroupIcon,
  PencilIcon,
  PlusIcon,
  TrashBinIcon,
  UserIcon,
} from "../../../icons";
import { accentFor } from "../../../utils/accent";
import { getErrorMessage } from "../../../utils/errors";
import { createSupplier, getSuppliers, updateSupplier } from "../api/suppliersApi";
import SupplierFormModal from "../components/SupplierFormModal";
import type { SupplierDto, SupplierFormValues } from "../types/supplier";

type ModalState =
  | { open: false; mode: "create"; supplier: null }
  | { open: true; mode: "create"; supplier: null }
  | { open: true; mode: "edit"; supplier: SupplierDto };

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="relative">
        <div className="absolute inset-0 scale-125 rounded-full bg-brand-500/10 blur-xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/25">
          <GroupIcon className="h-7 w-7" />
        </div>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">Belum ada supplier</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        Tambahkan supplier pertama agar purchase order dan utang supplier bisa mulai dikelola.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
      >
        <PlusIcon className="h-4 w-4" />
        Tambah supplier pertama
      </button>
    </div>
  );
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [modalState, setModalState] = useState<ModalState>({
    open: false,
    mode: "create",
    supplier: null,
  });
  const [deactivateTarget, setDeactivateTarget] = useState<SupplierDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadSuppliers() {
    setIsLoading(true);
    setError(null);

    try {
      setSuppliers(await getSuppliers());
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat daftar supplier."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSuppliers();
  }, []);

  const sortedSuppliers = useMemo(
    () => [...suppliers].sort((left, right) => left.name.localeCompare(right.name, "id-ID")),
    [suppliers],
  );

  const supplierStats = useMemo(() => {
    const active = suppliers.filter((supplier) => supplier.isActive).length;
    const withContact = suppliers.filter(
      (supplier) => supplier.phone || supplier.email || supplier.contactPerson,
    ).length;
    const withAddress = suppliers.filter((supplier) => supplier.address).length;
    return { total: suppliers.length, active, withContact, withAddress };
  }, [suppliers]);

  function openCreateModal() {
    setSubmitError(null);
    setModalState({ open: true, mode: "create", supplier: null });
  }

  function openEditModal(supplier: SupplierDto) {
    setSubmitError(null);
    setModalState({ open: true, mode: "edit", supplier });
  }

  function closeModal() {
    if (isSubmitting) {
      return;
    }

    setModalState({ open: false, mode: "create", supplier: null });
    setSubmitError(null);
  }

  async function handleSubmit(values: SupplierFormValues) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (modalState.mode === "create") {
        await createSupplier({
          name: values.name.trim(),
          contactPerson: values.contactPerson.trim() || null,
          phone: values.phone.trim() || null,
          email: values.email.trim() || null,
          address: values.address.trim() || null,
        });
        setSuccessMessage(`Supplier ${values.name.trim()} berhasil dibuat.`);
      } else {
        await updateSupplier(modalState.supplier.id, {
          name: values.name.trim(),
          contactPerson: values.contactPerson.trim() || null,
          phone: values.phone.trim() || null,
          email: values.email.trim() || null,
          address: values.address.trim() || null,
          isActive: values.isActive,
        });
        setSuccessMessage(`Supplier ${values.name.trim()} berhasil diperbarui.`);
      }

      closeModal();
      await loadSuppliers();
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError, "Gagal menyimpan supplier."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeactivateConfirm() {
    if (!deactivateTarget) {
      return;
    }

    setIsDeactivating(true);
    setError(null);

    try {
      await updateSupplier(deactivateTarget.id, {
        name: deactivateTarget.name,
        contactPerson: deactivateTarget.contactPerson,
        phone: deactivateTarget.phone,
        email: deactivateTarget.email,
        address: deactivateTarget.address,
        isActive: false,
      });
      setSuccessMessage(`Supplier ${deactivateTarget.name} berhasil dinonaktifkan.`);
      setDeactivateTarget(null);
      await loadSuppliers();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal menonaktifkan supplier."));
    } finally {
      setIsDeactivating(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Supplier"
      description="Kelola master supplier MorrusPOS untuk kebutuhan purchase order, pembelian tempo, dan pembayaran utang supplier."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-brand-50/80 via-white to-white p-6 shadow-theme-xs dark:border-gray-800 dark:from-brand-500/10 dark:via-gray-900 dark:to-gray-900 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-success-500/10 blur-3xl"
        />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] lg:items-center">
          <div>
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/25">
                <GroupIcon className="h-8 w-8" />
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-4 border-white bg-success-500 dark:border-gray-900">
                  <CheckCircleIcon className="h-3.5 w-3.5 text-white" />
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">
                  Procurement network
                </p>
                <h3 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                  Supplier terpercaya, pembelian lebih rapi
                </h3>
              </div>
            </div>
            <p className="mt-5 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-300">
              Simpan kontak, alamat, dan status supplier dalam satu master data untuk mempercepat
              purchase order, pembelian tempo, dan pembayaran utang.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                label: "Total supplier",
                value: supplierStats.total,
                icon: <GroupIcon className="h-5 w-5" />,
                tone: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300",
              },
              {
                label: "Supplier aktif",
                value: supplierStats.active,
                icon: <CheckCircleIcon className="h-5 w-5" />,
                tone: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-300",
              },
              {
                label: "Punya kontak",
                value: supplierStats.withContact,
                icon: <UserIcon className="h-5 w-5" />,
                tone: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-300",
              },
              {
                label: "Punya alamat",
                value: supplierStats.withAddress,
                icon: <BoxIcon className="h-5 w-5" />,
                tone: "bg-theme-purple-500/10 text-theme-purple-500",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white/80 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.tone}`}>
                  {stat.icon}
                </div>
                <p className="flex-1 text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AppTableShell
        title="Daftar supplier"
        description="Kelola relasi supplier dan pastikan data procurement tetap siap digunakan."
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
          >
            <PlusIcon className="h-4 w-4" />
            Tambah supplier
          </button>
        }
      >
        {isLoading ? (
          <AppLoader label="Memuat daftar supplier..." />
        ) : sortedSuppliers.length === 0 ? (
          <EmptyState onCreate={openCreateModal} />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {sortedSuppliers.map((supplier) => (
              <li
                key={supplier.id}
                className="group flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-gray-50/80 dark:hover:bg-white/[0.02] xl:flex-row xl:items-center sm:px-6"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-semibold ${accentFor(
                      supplier.name,
                    )}`}
                  >
                    {supplier.name.trim().charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {supplier.name}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          supplier.isActive
                            ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {supplier.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{supplier.contactPerson || "Kontak belum diisi"}</span>
                      <span className="text-gray-300 dark:text-gray-700">&bull;</span>
                      <span>{supplier.address || "Alamat belum diisi"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pl-15 text-xs text-gray-600 dark:text-gray-300 xl:max-w-[46%] xl:pl-0">
                  {supplier.phone ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-950">
                      <UserIcon className="h-3.5 w-3.5 text-brand-500" />
                      {supplier.phone}
                    </span>
                  ) : null}
                  {supplier.email ? (
                    <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-950">
                      <EnvelopeIcon className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                      <span className="truncate">{supplier.email}</span>
                    </span>
                  ) : null}
                  {!supplier.phone && !supplier.email ? (
                    <span className="rounded-xl bg-gray-50 px-3 py-2 text-gray-400 dark:bg-gray-950">
                      Kontak belum diisi
                    </span>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-2 pl-15 xl:pl-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(supplier)}
                    aria-label={`Edit ${supplier.name}`}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-3.5 text-xs font-semibold text-gray-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 dark:border-gray-800 dark:text-gray-200 dark:hover:border-brand-800 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeactivateTarget(supplier)}
                    aria-label={`Nonaktifkan ${supplier.name}`}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-error-200 px-3.5 text-xs font-semibold text-error-700 transition hover:bg-error-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-error-500/20 dark:border-error-500/20 dark:text-error-300 dark:hover:bg-error-500/10"
                  >
                    <TrashBinIcon className="h-4 w-4" />
                    Nonaktifkan
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppTableShell>

      <SupplierFormModal
        open={modalState.open}
        mode={modalState.mode}
        supplier={modalState.supplier}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        title="Nonaktifkan supplier"
        description={`Supplier ${deactivateTarget?.name ?? ""} akan disembunyikan dari list aktif dan tidak bisa dipilih lagi pada form purchase order baru.`}
        confirmLabel="Nonaktifkan supplier"
        isBusy={isDeactivating}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={() => void handleDeactivateConfirm()}
      />
    </ProtectedPageShell>
  );
}

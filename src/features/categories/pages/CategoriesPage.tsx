import { useEffect, useMemo, useState } from "react";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import {
  AppLoader,
  ConfirmDialog,
  InlineAlert,
  PagePlaceholder,
} from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../api/categoriesApi";
import CategoryFormModal from "../components/CategoryFormModal";
import type { CategoryDto, CategoryFormValues } from "../types/category";

function formatDate(value: string) {
  return new Date(value).toLocaleString("id-ID");
}

type ModalState =
  | { open: false; mode: "create"; category: null }
  | { open: true; mode: "create"; category: null }
  | { open: true; mode: "edit"; category: CategoryDto };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [modalState, setModalState] = useState<ModalState>({
    open: false,
    mode: "create",
    category: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<CategoryDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function loadCategories() {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getCategories();
      setCategories(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat daftar kategori."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  const sortedCategories = useMemo(
    () => [...categories].sort((left, right) => left.name.localeCompare(right.name, "id-ID")),
    [categories],
  );

  function openCreateModal() {
    setSubmitError(null);
    setModalState({
      open: true,
      mode: "create",
      category: null,
    });
  }

  function openEditModal(category: CategoryDto) {
    setSubmitError(null);
    setModalState({
      open: true,
      mode: "edit",
      category,
    });
  }

  function closeModal() {
    if (isSubmitting) {
      return;
    }

    setModalState({
      open: false,
      mode: "create",
      category: null,
    });
    setSubmitError(null);
  }

  async function handleCategorySubmit(values: CategoryFormValues) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (modalState.mode === "create") {
        await createCategory({
          name: values.name.trim(),
          parentId: values.parentId || null,
        });
        setSuccessMessage(`Kategori ${values.name.trim()} berhasil dibuat.`);
      } else {
        await updateCategory(modalState.category.id, {
          name: values.name.trim(),
          parentId: values.parentId || null,
        });
        setSuccessMessage(`Kategori ${values.name.trim()} berhasil diperbarui.`);
      }

      closeModal();
      await loadCategories();
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError, "Gagal menyimpan kategori."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteCategory(deleteTarget.id);
      setSuccessMessage(`Kategori ${deleteTarget.name} berhasil dihapus.`);
      setDeleteTarget(null);
      await loadCategories();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Gagal menghapus kategori. Pastikan kategori tidak memiliki child atau produk aktif.",
        ),
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Kategori"
      description="Kelola kategori produk MorrusPOS untuk menjaga struktur master data tetap rapi dan siap dipakai pada form produk."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      <AppTableShell
        title="Daftar kategori"
        description="Kelola kategori parent dan child untuk master produk."
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Tambah kategori
          </button>
        }
      >
        {isLoading ? (
          <AppLoader label="Memuat daftar kategori..." />
        ) : sortedCategories.length === 0 ? (
          <div className="p-6">
            <PagePlaceholder
              title="Belum ada kategori"
              description="Tambahkan kategori pertama agar form produk bisa dipakai."
              status="Empty"
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                {["Nama", "Parent", "Dibuat", "Diupdate", "Aksi"].map((column) => (
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
              {sortedCategories.map((category) => (
                <tr key={category.id} className="align-top">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{category.name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {category.parentName ?? "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(category.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(category.updatedAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(category)}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(category)}
                        className="rounded-xl border border-error-200 px-3 py-2 text-xs font-semibold text-error-700 dark:border-error-500/20 dark:text-error-300"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AppTableShell>

      <CategoryFormModal
        open={modalState.open}
        mode={modalState.mode}
        categories={categories}
        category={modalState.category}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onClose={closeModal}
        onSubmit={handleCategorySubmit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus kategori"
        description={`Anda yakin ingin menghapus kategori ${deleteTarget?.name ?? ""}? Backend dapat menolak aksi ini jika kategori masih punya child atau dipakai produk aktif.`}
        confirmLabel="Hapus kategori"
        isBusy={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </ProtectedPageShell>
  );
}

import { useEffect, useMemo, useState } from "react";
import { FieldErrorText } from "../../../components/forms";
import { Modal } from "../../../components/ui/modal";
import InlineAlert from "../../../components/ui/InlineAlert";
import { CheckLineIcon, ChevronDownIcon, FolderIcon, PlusIcon } from "../../../icons";
import { useCategoryOptions } from "../hooks/useCategoryOptions";
import type { CategoryFieldErrors } from "../schemas/categorySchema";
import { validateCategoryForm } from "../schemas/categorySchema";
import type { CategoryDto, CategoryFormValues } from "../types/category";

type CategoryFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  categories: CategoryDto[];
  category?: CategoryDto | null;
  isSubmitting: boolean;
  submitError?: string | null;
  onClose: () => void;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
};

const initialValues: CategoryFormValues = {
  name: "",
  parentId: "",
};

const MIN_NAME_LENGTH = 3;
const MAX_NAME_LENGTH = 100;

// Palet ini harus sama dengan CategoriesPage agar warna pratinjau konsisten
// dengan warna kategori di daftar. Idealnya dipindah ke satu file util bersama.
const palettes = [
  {
    tile: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300",
    bar: "bg-brand-500",
    glow: "bg-brand-500/15",
  },
  {
    tile: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-300",
    bar: "bg-success-500",
    glow: "bg-success-500/15",
  },
  {
    tile: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-300",
    bar: "bg-warning-500",
    glow: "bg-warning-500/15",
  },
  {
    tile: "bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-300",
    bar: "bg-orange-500",
    glow: "bg-orange-500/15",
  },
  {
    tile: "bg-theme-purple-500/10 text-theme-purple-500",
    bar: "bg-theme-purple-500",
    glow: "bg-theme-purple-500/15",
  },
  {
    tile: "bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/10 dark:text-blue-light-300",
    bar: "bg-blue-light-500",
    glow: "bg-blue-light-500/15",
  },
];

function toneFor(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash + name.charCodeAt(index)) % palettes.length;
  }
  return hash;
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className ?? ""}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function CategoryFormModal({
  open,
  mode,
  categories,
  category,
  isSubmitting,
  submitError,
  onClose,
  onSubmit,
}: CategoryFormModalProps) {
  const [values, setValues] = useState<CategoryFormValues>(initialValues);
  const [errors, setErrors] = useState<CategoryFieldErrors>({});
  const parentOptions = useCategoryOptions(categories, category?.id);

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(
      category
        ? {
            name: category.name,
            parentId: category.parentId ?? "",
          }
        : initialValues,
    );
    setErrors({});
  }, [category, open]);

  // Rantai induk dari akar sampai parent terpilih, dengan penjaga siklus.
  const parentChain = useMemo(() => {
    const byId = new Map(categories.map((item) => [item.id, item]));
    const chain: CategoryDto[] = [];
    const seen = new Set<string>();
    let cursor = byId.get(values.parentId);

    while (cursor && !seen.has(cursor.id)) {
      seen.add(cursor.id);
      chain.unshift(cursor);
      cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
    }

    return chain;
  }, [categories, values.parentId]);

  const trimmedName = values.name.trim();
  const displayName = trimmedName || "Nama kategori";
  const palette = palettes[toneFor(parentChain[0]?.name ?? (trimmedName || "Kategori"))];
  const level = parentChain.length + 1;
  const isNameValid = trimmedName.length >= MIN_NAME_LENGTH;
  const nameProgress = Math.min((values.name.length / MAX_NAME_LENGTH) * 100, 100);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateCategoryForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit({
      name: values.name.trim(),
      parentId: values.parentId,
    });
  }

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-xl p-6 sm:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white p-5 pr-12 dark:border-brand-500/20 dark:from-brand-500/10 dark:via-gray-900 dark:to-gray-900">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand-500/15 blur-2xl"
          />
          <div className="relative flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="absolute inset-0 scale-125 rounded-3xl bg-brand-500/20 blur-lg" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/25">
                {mode === "create" ? (
                  <PlusIcon className="h-6 w-6" />
                ) : (
                  <FolderIcon className="h-6 w-6" />
                )}
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {mode === "create" ? "Kategori baru" : "Edit kategori"}
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {mode === "create"
                  ? "Kelompokkan produk agar mudah dicari dan dilaporkan."
                  : category
                    ? `Perbarui nama atau induk dari ${category.name}.`
                    : "Perbarui nama atau induk kategori ini."}
              </p>
            </div>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <InlineAlert tone="error" message={submitError} />

          {/* Nama */}
          <label className="block">
            <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-gray-700 dark:text-gray-200">
              <span>
                Nama kategori <span className="text-error-500">*</span>
              </span>
              <span
                className={`inline-flex items-center gap-1 text-xs font-normal ${
                  isNameValid ? "text-success-600 dark:text-success-300" : "text-gray-400"
                }`}
              >
                {isNameValid ? <CheckLineIcon className="h-3.5 w-3.5" /> : null}
                {values.name.trim().length}/{MAX_NAME_LENGTH}
              </span>
            </span>
            <div className="relative">
              <FolderIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                value={values.name}
                onChange={(event) =>
                  setValues((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Contoh: Makanan ringan"
                maxLength={MAX_NAME_LENGTH}
                autoFocus
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isNameValid ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
                style={{ width: `${nameProgress}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-400">Minimal {MIN_NAME_LENGTH} karakter.</p>
            <FieldErrorText message={errors.name} />
          </label>

          {/* Parent */}
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Parent kategori
            </span>
            <div className="relative">
              <select
                value={values.parentId}
                onChange={(event) =>
                  setValues((current) => ({ ...current, parentId: event.target.value }))
                }
                className="h-12 w-full appearance-none rounded-2xl border border-gray-200 bg-white pl-4 pr-11 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              >
                <option value="">Tanpa parent</option>
                {parentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            </div>
            <p className="mt-1.5 text-xs text-gray-400">
              Kategori tidak bisa menjadi parent bagi dirinya sendiri.
            </p>
          </label>

          {/* Pratinjau hierarki */}
          <div
            className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-white/[0.02]"
            aria-live="polite"
          >
            <div aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${palette.bar}`} />
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl ${palette.glow}`}
            />

            <div className="relative flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Pratinjau di daftar
              </p>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-gray-600 shadow-theme-xs dark:bg-gray-900 dark:text-gray-300">
                {parentChain.length === 0 ? "Induk" : `Level ${level}`}
              </span>
            </div>

            <ul className="relative mt-4 space-y-2">
              {parentChain.map((item, index) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2.5"
                  style={{ paddingLeft: `${Math.min(index, 4) * 22}px` }}
                >
                  {index > 0 ? (
                    <span
                      aria-hidden="true"
                      className="-mt-4 h-4 w-3.5 shrink-0 rounded-bl-lg border-b border-l border-gray-300 dark:border-gray-700"
                    />
                  ) : null}
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl opacity-70 ${palette.tile}`}
                  >
                    <FolderIcon className="h-4 w-4" />
                  </span>
                  <span className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">
                    {item.name}
                  </span>
                </li>
              ))}

              <li
                className="flex items-center gap-2.5"
                style={{ paddingLeft: `${Math.min(parentChain.length, 4) * 22}px` }}
              >
                {parentChain.length > 0 ? (
                  <span
                    aria-hidden="true"
                    className="-mt-4 h-4 w-3.5 shrink-0 rounded-bl-lg border-b border-l border-gray-300 dark:border-gray-700"
                  />
                ) : null}
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-theme-xs ${palette.tile}`}
                >
                  <FolderIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p
                    className={`truncate text-sm font-semibold ${
                      trimmedName
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {displayName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                    {parentChain.length > 0
                      ? `Sub dari ${parentChain[parentChain.length - 1].name}`
                      : "Kategori utama"}
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Aksi */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 dark:border-gray-800 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-500/10 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <Spinner className="h-4 w-4" />
              ) : mode === "create" ? (
                <PlusIcon className="h-4 w-4" />
              ) : (
                <CheckLineIcon className="h-4 w-4" />
              )}
              {isSubmitting
                ? "Menyimpan..."
                : mode === "create"
                  ? "Simpan kategori"
                  : "Simpan perubahan"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
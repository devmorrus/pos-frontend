import { useEffect, useMemo, useState } from "react";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, ConfirmDialog, InlineAlert } from "../../../components/ui";
import { FolderIcon, GridIcon, ListIcon, PencilIcon, PlusIcon, TrashBinIcon } from "../../../icons";
import { getErrorMessage } from "../../../utils/errors";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../api/categoriesApi";
import CategoryFormModal from "../components/CategoryFormModal";
import type { CategoryDto, CategoryFormValues } from "../types/category";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFullDate(value: string) {
  return new Date(value).toLocaleString("id-ID");
}

// Setiap kategori induk mendapat satu warna, dan seluruh turunannya mengikuti.
const palettes = [
  {
    tile: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300",
    bar: "bg-brand-500",
    chip: "bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20",
  },
  {
    tile: "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-300",
    bar: "bg-success-500",
    chip: "bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-300 dark:hover:bg-success-500/20",
  },
  {
    tile: "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-300",
    bar: "bg-warning-500",
    chip: "bg-warning-50 text-warning-700 hover:bg-warning-100 dark:bg-warning-500/10 dark:text-warning-300 dark:hover:bg-warning-500/20",
  },
  {
    tile: "bg-orange-50 text-orange-500 dark:bg-orange-500/10 dark:text-orange-300",
    bar: "bg-orange-500",
    chip: "bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-300 dark:hover:bg-orange-500/20",
  },
  {
    tile: "bg-theme-purple-500/10 text-theme-purple-500",
    bar: "bg-theme-purple-500",
    chip: "bg-theme-purple-500/10 text-theme-purple-500 hover:bg-theme-purple-500/20",
  },
  {
    tile: "bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/10 dark:text-blue-light-300",
    bar: "bg-blue-light-500",
    chip: "bg-blue-light-50 text-blue-light-700 hover:bg-blue-light-100 dark:bg-blue-light-500/10 dark:text-blue-light-300 dark:hover:bg-blue-light-500/20",
  },
];

function toneFor(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash + name.charCodeAt(index)) % palettes.length;
  }
  return hash;
}

type CategoryRow = {
  category: CategoryDto;
  depth: number;
  rootId: string;
  ancestors: string[];
  childCount: number;
  tone: number;
};

function buildRows(categories: CategoryDto[]): CategoryRow[] {
  const knownIds = new Set(categories.map((category) => category.id));
  const childrenByParent = new Map<string | null, CategoryDto[]>();

  for (const category of categories) {
    const parentKey =
      category.parentId && knownIds.has(category.parentId) ? category.parentId : null;
    const siblings = childrenByParent.get(parentKey) ?? [];
    siblings.push(category);
    childrenByParent.set(parentKey, siblings);
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort((left, right) => left.name.localeCompare(right.name, "id-ID"));
  }

  const rows: CategoryRow[] = [];
  const visited = new Set<string>();

  function walk(
    parentId: string | null,
    depth: number,
    rootId: string | null,
    tone: number,
    ancestors: string[],
  ) {
    for (const category of childrenByParent.get(parentId) ?? []) {
      if (visited.has(category.id)) {
        continue;
      }
      visited.add(category.id);

      const currentRootId = rootId ?? category.id;
      const currentTone = rootId ? tone : toneFor(category.name);

      rows.push({
        category,
        depth,
        rootId: currentRootId,
        ancestors,
        childCount: childrenByParent.get(category.id)?.length ?? 0,
        tone: currentTone,
      });
      walk(category.id, depth + 1, currentRootId, currentTone, [...ancestors, category.id]);
    }
  }

  walk(null, 0, null, 0, []);

  // Orphans and cycles still deserve a row instead of silently disappearing.
  for (const category of categories) {
    if (!visited.has(category.id)) {
      rows.push({
        category,
        depth: 0,
        rootId: category.id,
        ancestors: [],
        childCount: 0,
        tone: toneFor(category.name),
      });
    }
  }

  return rows;
}

type CategoryGroup = {
  root: CategoryRow;
  items: CategoryRow[];
};

type ModalState =
  | { open: false; mode: "create"; category: null }
  | { open: true; mode: "create"; category: null }
  | { open: true; mode: "edit"; category: CategoryDto };

type ViewMode = "tree" | "grid";
type FilterMode = "all" | "parent" | "child";

/* -------------------------------------------------------------------------- */
/* Small visual pieces                                                        */
/* -------------------------------------------------------------------------- */

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M9.167 15.833a6.667 6.667 0 1 0 0-13.333 6.667 6.667 0 0 0 0 13.333ZM17.5 17.5l-3.625-3.625"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M6 7.5l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RatioRing({ parent, child }: { parent: number; child: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const total = parent + child;
  const gap = parent > 0 && child > 0 ? 4 : 0;
  const parentLength = total ? Math.max((parent / total) * circumference - gap, 0) : 0;
  const childLength = total ? Math.max((child / total) * circumference - gap, 0) : 0;

  return (
    <div className="relative h-40 w-40 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label="Perbandingan kategori induk dan sub-kategori">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="9"
          className="stroke-gray-100 dark:stroke-gray-800"
        />
        {parentLength > 0 ? (
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${parentLength} ${circumference}`}
            className="stroke-success-500 transition-all duration-500"
          />
        ) : null}
        {childLength > 0 ? (
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${childLength} ${circumference}`}
            strokeDashoffset={-(parentLength + gap)}
            className="stroke-brand-500 transition-all duration-500"
          />
        ) : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold text-gray-900 dark:text-white">{total}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">kategori</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

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
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("tree");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
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

  const categoryRows = useMemo(() => buildRows(categories), [categories]);

  const groups = useMemo<CategoryGroup[]>(() => {
    const map = new Map<string, CategoryGroup>();

    for (const row of categoryRows) {
      if (row.depth === 0) {
        map.set(row.category.id, { root: row, items: [] });
      }
    }
    for (const row of categoryRows) {
      if (row.depth > 0) {
        map.get(row.rootId)?.items.push(row);
      }
    }

    return [...map.values()];
  }, [categoryRows]);

  const parentCount = useMemo(
    () => categories.filter((category) => !category.parentId).length,
    [categories],
  );
  const childCount = categories.length - parentCount;

  const topGroups = useMemo(
    () =>
      [...groups]
        .filter((group) => group.items.length > 0)
        .sort((left, right) => right.items.length - left.items.length)
        .slice(0, 5),
    [groups],
  );
  const maxChildren = Math.max(1, ...groups.map((group) => group.items.length));

  const normalizedQuery = query.trim().toLowerCase();

  function matchesQuery(category: CategoryDto) {
    if (!normalizedQuery) {
      return true;
    }
    return (
      category.name.toLowerCase().includes(normalizedQuery) ||
      (category.parentName ?? "").toLowerCase().includes(normalizedQuery)
    );
  }

  // Saat mencari/memfilter, hierarki diratakan supaya hasil tidak tersembunyi.
  const isFlat = Boolean(normalizedQuery) || filter !== "all";

  const visibleRows = useMemo(
    () =>
      categoryRows.filter((row) => {
        if (!matchesQuery(row.category)) {
          return false;
        }
        if (filter === "parent" && row.depth !== 0) {
          return false;
        }
        if (filter === "child" && row.depth === 0) {
          return false;
        }
        if (!isFlat && row.ancestors.some((id) => collapsed.has(id))) {
          return false;
        }
        return true;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categoryRows, normalizedQuery, filter, collapsed, isFlat],
  );

  const visibleGroups = useMemo(
    () =>
      groups.filter(
        (group) =>
          matchesQuery(group.root.category) ||
          group.items.some((item) => matchesQuery(item.category)),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groups, normalizedQuery],
  );

  const resultCount = view === "tree" ? visibleRows.length : visibleGroups.length;
  const resultTotal = view === "tree" ? categoryRows.length : groups.length;
  const resultUnit = view === "tree" ? "kategori" : "kelompok induk";

  function toggleCollapse(id: string) {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function collapseAll() {
    setCollapsed(
      new Set(categoryRows.filter((row) => row.childCount > 0).map((row) => row.category.id)),
    );
  }

  function expandAll() {
    setCollapsed(new Set());
  }

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

  const filterOptions: { value: FilterMode; label: string }[] = [
    { value: "all", label: "Semua" },
    { value: "parent", label: "Induk" },
    { value: "child", label: "Sub-kategori" },
  ];

  const actionButtonBase =
    "flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition focus-visible:outline-none focus-visible:ring-4 dark:text-gray-400";

  return (
    <ProtectedPageShell
      title="Kategori"
      description="Kelola kategori produk MorrusPOS untuk menjaga struktur master data tetap rapi dan siap dipakai pada form produk."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      {/* ------------------------------ Hero visual ------------------------------ */}
      <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-brand-50/80 via-white to-white p-6 shadow-theme-xs dark:border-gray-800 dark:from-brand-500/10 dark:via-gray-900 dark:to-gray-900 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-success-500/10 blur-3xl"
        />

        <div className="relative grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
          {/* Ring */}
          <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col">
            <RatioRing parent={parentCount} child={childCount} />
            <div className="flex gap-5 text-xs text-gray-600 dark:text-gray-300 sm:flex-col sm:gap-2 lg:flex-row lg:gap-5">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-success-500" />
                Induk
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                Sub-kategori
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-3">
            {[
              {
                label: "Total kategori",
                value: categories.length,
                icon: <FolderIcon className="h-5 w-5" />,
                iconClass: palettes[0].tile,
              },
              {
                label: "Kategori induk",
                value: parentCount,
                icon: <GridIcon className="h-5 w-5" />,
                iconClass: palettes[1].tile,
              },
              {
                label: "Sub-kategori",
                value: childCount,
                icon: <ListIcon className="h-5 w-5" />,
                iconClass: palettes[2].tile,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-4 rounded-2xl border border-gray-200/80 bg-white/80 px-4 py-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconClass}`}
                >
                  {stat.icon}
                </div>
                <p className="flex-1 text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Distribution */}
          <div className="rounded-2xl border border-gray-200/80 bg-white/80 p-5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Induk dengan sub-kategori terbanyak
            </h3>
            {topGroups.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Belum ada sub-kategori. Tambahkan kategori dengan induk untuk melihat sebarannya
                di sini.
              </p>
            ) : (
              <ul className="mt-4 space-y-3.5">
                {topGroups.map((group) => (
                  <li key={group.root.category.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                      <span className="truncate font-medium text-gray-700 dark:text-gray-200">
                        {group.root.category.name}
                      </span>
                      <span className="shrink-0 text-gray-500 dark:text-gray-400">
                        {group.items.length} sub
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${palettes[group.root.tone].bar}`}
                        style={{ width: `${(group.items.length / maxChildren) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* -------------------------------- Daftar -------------------------------- */}
      <AppTableShell
        title="Daftar kategori"
        description="Kategori induk dan sub-kategori tersusun otomatis sesuai hierarkinya."
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
          >
            <PlusIcon className="h-4 w-4" />
            Tambah kategori
          </button>
        }
      >
        {isLoading ? (
          <AppLoader label="Memuat daftar kategori..." />
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="relative">
              <div className="absolute inset-0 scale-125 rounded-full bg-brand-500/10 blur-xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/25">
                <FolderIcon className="h-7 w-7" />
              </div>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">
              Belum ada kategori
            </h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
              Tambahkan kategori pertama agar form produk bisa dipakai dan laporan tetap
              terstruktur.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              <PlusIcon className="h-4 w-4" />
              Tambah kategori pertama
            </button>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-xs">
                  <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari kategori atau induk..."
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-9 text-sm text-gray-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label="Bersihkan pencarian"
                      className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                    >
                      <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                        <path
                          d="M4 4l8 8M12 4l-8 8"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {resultCount} dari {resultTotal} {resultUnit}
                  </p>
                  <div
                    role="group"
                    aria-label="Mode tampilan"
                    className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-950"
                  >
                    {(
                      [
                        { value: "tree", label: "Pohon", icon: <ListIcon className="h-4 w-4" /> },
                        { value: "grid", label: "Kartu", icon: <GridIcon className="h-4 w-4" /> },
                      ] as const
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setView(option.value)}
                        aria-pressed={view === option.value}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 ${
                          view === option.value
                            ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                      >
                        {option.icon}
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {view === "tree" ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFilter(option.value)}
                        aria-pressed={filter === option.value}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 ${
                          filter === option.value
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {!isFlat ? (
                    <div className="flex items-center gap-3 text-xs font-medium">
                      <button
                        type="button"
                        onClick={expandAll}
                        className="text-brand-600 transition hover:text-brand-700 dark:text-brand-300"
                      >
                        Buka semua
                      </button>
                      <span className="text-gray-300 dark:text-gray-700">|</span>
                      <button
                        type="button"
                        onClick={collapseAll}
                        className="text-brand-600 transition hover:text-brand-700 dark:text-brand-300"
                      >
                        Tutup semua
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Empty search state */}
            {resultCount === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                  <SearchIcon className="h-6 w-6" />
                </div>
                <p className="mt-4 font-semibold text-gray-900 dark:text-white">
                  Kategori tidak ditemukan
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {normalizedQuery
                    ? `Tidak ada kategori yang cocok dengan \u201C${query.trim()}\u201D.`
                    : "Tidak ada kategori pada filter ini."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setFilter("all");
                  }}
                  className="mt-4 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Reset pencarian
                </button>
              </div>
            ) : view === "tree" ? (
              /* ------------------------------ Tree view ------------------------------ */
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {visibleRows.map(({ category, depth, childCount: directChildren, tone }) => {
                  const palette = palettes[tone];
                  const indent = isFlat ? 0 : Math.min(depth, 3);
                  const isCollapsed = collapsed.has(category.id);

                  return (
                    <li
                      key={category.id}
                      className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-gray-50/80 dark:hover:bg-white/[0.02] sm:flex-row sm:items-center sm:px-6"
                    >
                      <div
                        className="flex min-w-0 flex-1 items-center gap-3"
                        style={{ paddingLeft: `${indent * 28}px` }}
                      >
                        {indent > 0 ? (
                          <span
                            aria-hidden="true"
                            className="-mt-5 h-5 w-4 shrink-0 rounded-bl-xl border-b border-l border-gray-300 dark:border-gray-700"
                          />
                        ) : null}

                        {!isFlat ? (
                          directChildren > 0 ? (
                            <button
                              type="button"
                              onClick={() => toggleCollapse(category.id)}
                              aria-expanded={!isCollapsed}
                              aria-label={`${isCollapsed ? "Buka" : "Tutup"} sub-kategori ${category.name}`}
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                            >
                              <ChevronIcon
                                className={`h-4 w-4 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                              />
                            </button>
                          ) : (
                            <span className="w-6 shrink-0" aria-hidden="true" />
                          )
                        ) : null}

                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${palette.tile}`}
                        >
                          <FolderIcon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {category.name}
                            </p>
                            {depth === 0 ? (
                              <span className="rounded-full bg-success-50 px-2 py-0.5 text-[11px] font-semibold text-success-700 dark:bg-success-500/10 dark:text-success-300">
                                Induk
                              </span>
                            ) : null}
                            {directChildren > 0 ? (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                {directChildren} sub
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>
                              {category.parentName
                                ? `Sub dari ${category.parentName}`
                                : "Kategori utama"}
                            </span>
                            <span className="text-gray-300 dark:text-gray-700">&bull;</span>
                            <span title={formatFullDate(category.updatedAt)}>
                              Diperbarui {formatDate(category.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1 self-end transition-opacity sm:self-auto sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => openEditModal(category)}
                          aria-label={`Edit ${category.name}`}
                          title="Edit kategori"
                          className={`${actionButtonBase} hover:bg-brand-50 hover:text-brand-600 focus-visible:ring-brand-500/20 dark:hover:bg-brand-500/10 dark:hover:text-brand-300`}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(category)}
                          aria-label={`Hapus ${category.name}`}
                          title="Hapus kategori"
                          className={`${actionButtonBase} hover:bg-error-50 hover:text-error-600 focus-visible:ring-error-500/20 dark:hover:bg-error-500/10 dark:hover:text-error-300`}
                        >
                          <TrashBinIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              /* ------------------------------ Grid view ------------------------------ */
              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
                {visibleGroups.map(({ root, items }) => {
                  const palette = palettes[root.tone];
                  const share = (items.length / maxChildren) * 100;

                  return (
                    <article
                      key={root.category.id}
                      className="group relative flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-theme-xs transition-shadow hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
                    >
                      <div
                        aria-hidden="true"
                        className={`absolute inset-x-0 top-0 h-1 ${palette.bar}`}
                      />

                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${palette.tile}`}
                        >
                          <FolderIcon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-gray-900 dark:text-white">
                            {root.category.name}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {items.length > 0
                              ? `${items.length} sub-kategori`
                              : "Belum ada sub-kategori"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(root.category)}
                            aria-label={`Edit ${root.category.name}`}
                            title="Edit kategori"
                            className={`${actionButtonBase} hover:bg-brand-50 hover:text-brand-600 focus-visible:ring-brand-500/20 dark:hover:bg-brand-500/10 dark:hover:text-brand-300`}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(root.category)}
                            aria-label={`Hapus ${root.category.name}`}
                            title="Hapus kategori"
                            className={`${actionButtonBase} hover:bg-error-50 hover:text-error-600 focus-visible:ring-error-500/20 dark:hover:bg-error-500/10 dark:hover:text-error-300`}
                          >
                            <TrashBinIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className={`h-full rounded-full ${palette.bar}`}
                          style={{ width: `${share}%` }}
                        />
                      </div>

                      <div className="mt-4 flex min-h-[2.5rem] flex-1 flex-wrap content-start gap-2">
                        {items.length === 0 ? (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Kategori ini berdiri sendiri.
                          </p>
                        ) : (
                          items.map((item) => (
                            <button
                              key={item.category.id}
                              type="button"
                              onClick={() => openEditModal(item.category)}
                              title={`Edit ${item.category.name}`}
                              className={`rounded-full px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 ${palette.chip} ${
                                normalizedQuery && !matchesQuery(item.category)
                                  ? "opacity-40"
                                  : ""
                              }`}
                            >
                              {item.category.name}
                            </button>
                          ))
                        )}
                      </div>

                      <p
                        className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400"
                        title={formatFullDate(root.category.updatedAt)}
                      >
                        Diperbarui {formatDate(root.category.updatedAt)}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </>
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
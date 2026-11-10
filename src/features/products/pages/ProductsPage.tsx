import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, ConfirmDialog, InlineAlert } from "../../../components/ui";
import {
  AlertIcon,
  BoxCubeIcon,
  ErrorIcon,
  GridIcon,
  ListIcon,
  PencilIcon,
  PlusIcon,
  TrashBinIcon,
} from "../../../icons";
import { accentFor } from "../../../utils/accent";
import { getErrorMessage } from "../../../utils/errors";
import { getCategories } from "../../categories/api/categoriesApi";
import type { CategoryDto } from "../../categories/types/category";
import { useAuth } from "../../auth/hooks/useAuth";
import { isOwner } from "../../auth/utils/access";
import { useOutlet } from "../../outlets/hooks/useOutlet";
import { deleteProduct, getProducts } from "../api/productsApi";
import type { ProductDto, ProductTrackingMode } from "../types/product";
import {
  formatRupiah,
  formatStockQuantity,
  getConsignmentLabel,
  getConsignmentTone,
  getStockBadgeClasses,
} from "../utils/presentation";
import { API_BASE_URL } from "../../../api/client/config";

type ProductsLocationState = {
  successMessage?: string;
};

type ViewMode = "list" | "grid";

const trackingLabels: Record<ProductTrackingMode, string> = {
  none: "Non-stok",
  quantity: "Quantity",
  batch: "Batch",
  serial: "Serial / IMEI",
};

const trackingOptions: { value: "all" | ProductTrackingMode; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "none", label: "Non-stok" },
  { value: "quantity", label: "Quantity" },
  { value: "batch", label: "Batch" },
  { value: "serial", label: "Serial / IMEI" },
];

const barTones = [
  "bg-brand-500",
  "bg-success-500",
  "bg-warning-500",
  "bg-orange-500",
  "bg-theme-purple-500",
  "bg-blue-light-500",
];

const actionButtonBase =
  "flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition focus-visible:outline-none focus-visible:ring-4 dark:text-gray-400";

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

function StockRing({ safe, attention }: { safe: number; attention: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const total = safe + attention;
  const gap = safe > 0 && attention > 0 ? 4 : 0;
  const safeLength = total ? Math.max((safe / total) * circumference - gap, 0) : 0;
  const attentionLength = total ? Math.max((attention / total) * circumference - gap, 0) : 0;

  return (
    <div className="relative h-40 w-40 shrink-0">
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full -rotate-90"
        role="img"
        aria-label="Perbandingan produk dengan stok aman dan perlu perhatian"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="9"
          className="stroke-gray-100 dark:stroke-gray-800"
        />
        {safeLength > 0 ? (
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${safeLength} ${circumference}`}
            className="stroke-success-500 transition-all duration-500"
          />
        ) : null}
        {attentionLength > 0 ? (
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${attentionLength} ${circumference}`}
            strokeDashoffset={-(safeLength + gap)}
            className="stroke-warning-500 transition-all duration-500"
          />
        ) : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold text-gray-900 dark:text-white">{total}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">produk</span>
      </div>
    </div>
  );
}

function ProductThumbnail({
  product,
  size = "md",
}: {
  product: ProductDto;
  size?: "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const sizeClass = size === "lg" ? "h-16 w-16 rounded-2xl text-lg" : "h-11 w-11 rounded-2xl text-sm";
  const initial = product.name.trim().charAt(0).toUpperCase() || "?";

  if (product.imageUrl && !failed) {
    return (
      <div
        className={`${sizeClass} shrink-0 overflow-hidden border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900`}
      >
        <img
          src={`${API_BASE_URL}${product.imageUrl}`}
          alt={product.name}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center font-semibold ${accentFor(product.name)}`}
    >
      {initial}
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="relative">
        <div className="absolute inset-0 scale-125 rounded-full bg-brand-500/10 blur-xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/25">
          <BoxCubeIcon className="h-7 w-7" />
        </div>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

function getStockPresentation(product: ProductDto) {
  if (product.trackingMode === "none") {
    return {
      label: "Selalu tersedia",
      tone: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    };
  }

  return {
    label: `Stok ${formatStockQuantity(product.qtyOnHand)}`,
    tone: getStockBadgeClasses(product.qtyOnHand),
  };
}

export default function ProductsPage() {
  const location = useLocation();
  const { session } = useAuth();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const { selectedOutletId } = useOutlet();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as ProductsLocationState | null)?.successMessage ?? null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ProductDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [trackingFilter, setTrackingFilter] = useState<"all" | ProductTrackingMode>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("list");

  const ownerMode = isOwner(session?.role);

  const categoryNameById = useMemo(
    () =>
      new Map(
        categories.map((category) => [
          category.id,
          category.parentName ? `${category.parentName} / ${category.name}` : category.name,
        ]),
      ),
    [categories],
  );

  async function loadLookups() {
    const categoriesResult = await getCategories();
    setCategories(categoriesResult);
  }

  async function loadProducts(currentOutletId: string | null) {
    if (ownerMode && !currentOutletId) {
      setProducts([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const outletId = currentOutletId || session?.outletId || undefined;
    const result = await getProducts(outletId ? { outletId } : {});
    setProducts(result);
  }

  useEffect(() => {
    async function loadPage() {
      setIsLoading(true);
      setError(null);

      try {
        await loadLookups();
        await loadProducts(selectedOutletId);
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat daftar produk."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadPage();
  }, [ownerMode, selectedOutletId, session?.outletId, session?.role]);

  async function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteProduct(deleteTarget.id);
      setSuccessMessage(
        `Produk ${deleteTarget.name} berhasil dihapus atau dinonaktifkan sesuai aturan backend.`,
      );
      setDeleteTarget(null);
      await loadProducts(selectedOutletId);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal menghapus produk."));
    } finally {
      setIsDeleting(false);
    }
  }

  const shouldShowOutletPrompt = ownerMode && !selectedOutletId;

  const normalizedQuery = query.trim().toLowerCase();
  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        if (trackingFilter !== "all" && product.trackingMode !== trackingFilter) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        const categoryName = categoryNameById.get(product.categoryId) ?? "";
        return (
          product.name.toLowerCase().includes(normalizedQuery) ||
          product.sku.toLowerCase().includes(normalizedQuery) ||
          (product.barcode ?? "").toLowerCase().includes(normalizedQuery) ||
          categoryName.toLowerCase().includes(normalizedQuery)
        );
      }),
    [products, trackingFilter, normalizedQuery, categoryNameById],
  );

  const stockStats = useMemo(() => {
    const tracked = products.filter((product) => product.trackingMode !== "none");
    const low = tracked.filter(
      (product) => product.qtyOnHand > 0 && product.qtyOnHand <= 5,
    ).length;
    const out = tracked.filter((product) => product.qtyOnHand <= 0).length;

    return {
      low,
      out,
      safe: products.length - low - out,
      attention: low + out,
    };
  }, [products]);

  const categoryStats = useMemo(() => {
    const counts = new Map<string, number>();

    for (const product of products) {
      counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
    }

    const items = [...counts.entries()]
      .map(([id, count]) => ({
        id,
        name: categoryNameById.get(id) ?? "Tanpa kategori",
        count,
      }))
      .sort((left, right) => right.count - left.count);

    return {
      items: items.slice(0, 5),
      max: Math.max(1, ...items.map((item) => item.count)),
    };
  }, [products, categoryNameById]);

  function resetFilters() {
    setQuery("");
    setTrackingFilter("all");
  }

  return (
    <ProtectedPageShell
      title="Produk"
      description="Kelola master produk MorrusPOS lengkap dengan kategori, harga, tipe konsinyasi, dan stok per outlet."
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
          <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col">
            <StockRing safe={stockStats.safe} attention={stockStats.attention} />
            <div className="flex gap-5 text-xs text-gray-600 dark:text-gray-300 sm:flex-col sm:gap-2 lg:flex-row lg:gap-5">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-success-500" />
                Stok aman
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-warning-500" />
                Perlu perhatian
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            {[
              {
                label: "Total produk",
                value: products.length,
                icon: <BoxCubeIcon className="h-5 w-5" />,
                iconClass:
                  "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300",
              },
              {
                label: "Stok menipis",
                value: stockStats.low,
                icon: <AlertIcon className="h-5 w-5" />,
                iconClass:
                  "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-300",
              },
              {
                label: "Stok habis",
                value: stockStats.out,
                icon: <ErrorIcon className="h-5 w-5" />,
                iconClass:
                  "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-300",
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

          <div className="rounded-2xl border border-gray-200/80 bg-white/80 p-5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/70">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Kategori dengan produk terbanyak
            </h3>
            {categoryStats.items.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Belum ada produk untuk dihitung. Tambahkan produk untuk melihat sebarannya di
                sini.
              </p>
            ) : (
              <ul className="mt-4 space-y-3.5">
                {categoryStats.items.map((item, index) => (
                  <li key={item.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                      <span className="truncate font-medium text-gray-700 dark:text-gray-200">
                        {item.name}
                      </span>
                      <span className="shrink-0 text-gray-500 dark:text-gray-400">
                        {item.count} produk
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barTones[index % barTones.length]}`}
                        style={{ width: `${(item.count / categoryStats.max) * 100}%` }}
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
        title="Daftar produk"
        description="Kelola master produk beserta stok per outlet aktif."
        actions={
          <Link
            to="/products/create"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
          >
            <PlusIcon className="h-4 w-4" />
            Tambah produk
          </Link>
        }
      >
        {isLoading ? (
          <AppLoader label="Memuat daftar produk..." />
        ) : shouldShowOutletPrompt ? (
          <EmptyState
            title="Pilih outlet terlebih dahulu"
            description="Owner perlu memilih outlet agar listing produk dan stok saat ini dapat dimuat dengan konteks yang benar. Gunakan pemilih outlet di header."
          />
        ) : products.length === 0 ? (
          <EmptyState
            title="Belum ada produk"
            description="Tambahkan produk pertama untuk outlet yang sedang dipilih agar modul kasir dan stok siap dilanjutkan."
            action={
              <Link
                to="/products/create"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                <PlusIcon className="h-4 w-4" />
                Tambah produk pertama
              </Link>
            }
          />
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
                    placeholder="Cari produk, SKU, atau barcode..."
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
                    {filteredProducts.length} dari {products.length} produk
                  </p>
                  <div
                    role="group"
                    aria-label="Mode tampilan"
                    className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-950"
                  >
                    {(
                      [
                        { value: "list", label: "Daftar", icon: <ListIcon className="h-4 w-4" /> },
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

              <div className="flex flex-wrap gap-2">
                {trackingOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTrackingFilter(option.value)}
                    aria-pressed={trackingFilter === option.value}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 ${
                      trackingFilter === option.value
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                  <SearchIcon className="h-6 w-6" />
                </div>
                <p className="mt-4 font-semibold text-gray-900 dark:text-white">
                  Produk tidak ditemukan
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {normalizedQuery
                    ? `Tidak ada produk yang cocok dengan \u201C${query.trim()}\u201D.`
                    : "Tidak ada produk pada filter ini."}
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Reset pencarian
                </button>
              </div>
            ) : view === "list" ? (
              /* ------------------------------ List view ------------------------------ */
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredProducts.map((product) => {
                  const stock = getStockPresentation(product);
                  const categoryName =
                    categoryNameById.get(product.categoryId) ?? "Tanpa kategori";

                  return (
                    <li
                      key={product.id}
                      className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-gray-50/80 dark:hover:bg-white/[0.02] sm:px-6 lg:flex-row lg:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <ProductThumbnail product={product} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {product.name}
                            </p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getConsignmentTone(
                                product.isConsignment,
                              )}`}
                            >
                              {getConsignmentLabel(product.isConsignment)}
                            </span>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                              {trackingLabels[product.trackingMode]}
                            </span>
                            {product.costPrice > product.basePrice ? (
                              <span className="rounded-full bg-error-50 px-2 py-0.5 text-[11px] font-semibold text-error-700 dark:bg-error-500/10 dark:text-error-300">
                                Margin negatif
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-medium">{product.sku}</span>
                            <span className="text-gray-300 dark:text-gray-700">&bull;</span>
                            <span>{categoryName}</span>
                            {product.barcode ? (
                              <>
                                <span className="text-gray-300 dark:text-gray-700">&bull;</span>
                                <span>Barcode {product.barcode}</span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex w-full flex-col gap-2 pl-14 lg:w-auto lg:flex-row lg:items-center lg:gap-3 lg:pl-0">
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatRupiah(product.basePrice)}
                            <span className="ml-1 text-xs font-normal text-gray-400">
                              / {product.unit}
                            </span>
                          </p>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${stock.tone}`}
                          >
                            {stock.label}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 self-end transition-opacity lg:self-auto lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
                          <Link
                            to={`/products/${product.id}/edit`}
                            aria-label={`Edit ${product.name}`}
                            title="Edit produk"
                            className={`${actionButtonBase} hover:bg-brand-50 hover:text-brand-600 focus-visible:ring-brand-500/20 dark:hover:bg-brand-500/10 dark:hover:text-brand-300`}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(product)}
                            aria-label={`Hapus ${product.name}`}
                            title="Hapus produk"
                            className={`${actionButtonBase} hover:bg-error-50 hover:text-error-600 focus-visible:ring-error-500/20 dark:hover:bg-error-500/10 dark:hover:text-error-300`}
                          >
                            <TrashBinIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              /* ------------------------------ Grid view ------------------------------ */
              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
                {filteredProducts.map((product) => {
                  const stock = getStockPresentation(product);
                  const categoryName =
                    categoryNameById.get(product.categoryId) ?? "Tanpa kategori";

                  return (
                    <article
                      key={product.id}
                      className="group flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-theme-xs transition-shadow hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <ProductThumbnail product={product} size="lg" />
                        <div className="flex shrink-0 items-center gap-0.5">
                          <Link
                            to={`/products/${product.id}/edit`}
                            aria-label={`Edit ${product.name}`}
                            title="Edit produk"
                            className={`${actionButtonBase} hover:bg-brand-50 hover:text-brand-600 focus-visible:ring-brand-500/20 dark:hover:bg-brand-500/10 dark:hover:text-brand-300`}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(product)}
                            aria-label={`Hapus ${product.name}`}
                            title="Hapus produk"
                            className={`${actionButtonBase} hover:bg-error-50 hover:text-error-600 focus-visible:ring-error-500/20 dark:hover:bg-error-500/10 dark:hover:text-error-300`}
                          >
                            <TrashBinIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 min-w-0">
                        <p className="line-clamp-2 text-base font-semibold text-gray-900 dark:text-white">
                          {product.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                          {categoryName}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getConsignmentTone(
                              product.isConsignment,
                            )}`}
                          >
                            {getConsignmentLabel(product.isConsignment)}
                          </span>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            {trackingLabels[product.trackingMode]}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                            Harga jual
                          </p>
                          <p className="mt-0.5 text-lg font-semibold text-gray-900 dark:text-white">
                            {formatRupiah(product.basePrice)}
                            <span className="ml-1 text-xs font-normal text-gray-400">
                              / {product.unit}
                            </span>
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${stock.tone}`}
                        >
                          {stock.label}
                        </span>
                      </div>

                      {product.costPrice > product.basePrice ? (
                        <p className="mt-2 text-[11px] font-semibold text-error-600 dark:text-error-400">
                          Margin negatif: harga jual di bawah harga modal.
                        </p>
                      ) : null}

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                        <span className="truncate font-medium">{product.sku}</span>
                        <span className="truncate">
                          {product.barcode ? `Barcode ${product.barcode}` : "Tanpa barcode"}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </AppTableShell>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus produk"
        description={`Anda yakin ingin menghapus produk ${deleteTarget?.name ?? ""}? Backend dapat melakukan hard delete atau menonaktifkan produk jika sudah punya riwayat transaksi.`}
        confirmLabel="Hapus produk"
        isBusy={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </ProtectedPageShell>
  );
}

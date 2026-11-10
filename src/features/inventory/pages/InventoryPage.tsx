import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, InlineAlert } from "../../../components/ui";
import { Modal } from "../../../components/ui/modal";
import {
  AlertIcon,
  BoxCubeIcon,
  BoxIcon,
  DocsIcon,
  ErrorIcon,
  EyeIcon,
  GridIcon,
  ListIcon,
  PaperPlaneIcon,
  TaskIcon,
} from "../../../icons";
import { useCapabilities } from "../../capabilities/hooks/useCapabilities";
import { accentFor } from "../../../utils/accent";
import { getErrorMessage } from "../../../utils/errors";
import { getConsignmentLabel, getConsignmentTone } from "../../products/utils/presentation";
import { useRealtime } from "../../../lib/realtime/hooks";
import { getInventory } from "../api/inventoryApi";
import { getProductTrackingOptions } from "../../products/api/productsApi";
import type { ProductTrackingOptionsDto } from "../../products/types/product";
import StockStatusBadge from "../components/StockStatusBadge";
import { useStockOutletScope } from "../hooks/useStockOutletScope";
import type { InventoryListItem } from "../types/inventory";
import { formatDateTime, formatQuantity } from "../utils/presentation";

type ViewMode = "list" | "grid";

const trackingLabels: Record<InventoryListItem["trackingMode"], string> = {
  quantity: "Quantity",
  batch: "Batch",
  serial: "Serial / IMEI",
};

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
        aria-label="Perbandingan item dengan stok aman dan perlu perhatian"
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
        <span className="text-xs text-gray-500 dark:text-gray-400">item</span>
      </div>
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function InventoryPage() {
  const { ownerMode, effectiveOutletId } = useStockOutletScope();
  const { hasCapability } = useCapabilities();
  const { onStockUpdate } = useRealtime();
  const [items, setItems] = useState<InventoryListItem[]>([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [stockMode, setStockMode] = useState<"all" | "low">("all");
  const [includeZeroStock, setIncludeZeroStock] = useState(true);
  const [view, setView] = useState<ViewMode>("list");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingDetail, setTrackingDetail] = useState<{
    item: InventoryListItem;
    options: ProductTrackingOptionsDto;
  } | null>(null);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);

  async function openTrackingDetail(item: InventoryListItem) {
    if (!effectiveOutletId) return;
    setIsLoadingTracking(true);
    setError(null);
    try {
      const options = await getProductTrackingOptions(
        item.productId,
        effectiveOutletId,
        item.productVariantId,
        undefined,
        true,
      );
      setTrackingDetail({ item, options });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat detail batch/serial."));
    } finally {
      setIsLoadingTracking(false);
    }
  }

  async function loadInventory() {
    if (!effectiveOutletId) {
      setItems([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getInventory({
        stockLocationId: effectiveOutletId,
        search: appliedSearch,
        lowStockOnly: stockMode === "low",
        includeZeroStock,
      });
      setItems(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat inventory outlet."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadInventory();
  }, [effectiveOutletId, appliedSearch, stockMode, includeZeroStock]);

  useEffect(() => {
    const unsubscribe = onStockUpdate((event) => {
      if ((event.stockLocationId ?? event.outletId) === effectiveOutletId) {
        void loadInventory();
      }
    });

    return unsubscribe;
  }, [effectiveOutletId, onStockUpdate]);

  const stockStats = useMemo(() => {
    const out = items.filter((item) => item.qtyOnHand <= 0).length;
    const low = items.filter(
      (item) =>
        item.qtyOnHand > 0 && (item.isLowStock || item.qtyOnHand <= item.minStockAlert),
    ).length;

    return {
      low,
      out,
      safe: items.length - low - out,
      attention: low + out,
    };
  }, [items]);

  const categoryStats = useMemo(() => {
    const counts = new Map<string, number>();

    for (const item of items) {
      const name = item.categoryName || "Tanpa kategori";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }

    const all = [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count);

    return {
      items: all.slice(0, 5),
      max: Math.max(1, ...all.map((entry) => entry.count)),
    };
  }, [items]);

  const shouldShowOutletPrompt = ownerMode && !effectiveOutletId;
  const hasActiveFilters =
    Boolean(appliedSearch) || stockMode === "low" || !includeZeroStock;

  function resetFilters() {
    setSearch("");
    setAppliedSearch("");
    setStockMode("all");
    setIncludeZeroStock(true);
  }

  function applySearch() {
    setAppliedSearch(search);
  }

  return (
    <ProtectedPageShell
      title="Stok"
      description="Pantau stok outlet aktif dan deteksi stok rendah. Gunakan tombol aksi untuk mengatur buffer, membuat opname, atau memindahkan stok antar outlet."
    >
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
                label: "Total item",
                value: items.length,
                icon: <BoxCubeIcon className="h-5 w-5" />,
                iconClass:
                  "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300",
              },
              {
                label: "Stok rendah",
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
              Kategori dengan item terbanyak
            </h3>
            {categoryStats.items.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Belum ada item inventory untuk dihitung pada outlet ini.
              </p>
            ) : (
              <ul className="mt-4 space-y-3.5">
                {categoryStats.items.map((item, index) => (
                  <li key={item.name}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                      <span className="truncate font-medium text-gray-700 dark:text-gray-200">
                        {item.name}
                      </span>
                      <span className="shrink-0 text-gray-500 dark:text-gray-400">
                        {item.count} item
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
        title="Inventory outlet"
        description="Stok per outlet aktif, lengkap dengan status dan detail tracking."
        actions={
          <div className="flex flex-col items-start gap-1.5 sm:items-end">
            <div className="flex flex-wrap items-center gap-3">
              {hasCapability("inventory.buffer_stock") ? (
                <Link
                  to="/buffer-stock"
                  className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20"
                >
                  <BoxIcon className="h-4 w-4" />
                  Atur buffer stock
                </Link>
              ) : null}
              {hasCapability("inventory.opname") ? (
                <Link
                  to="/stock-opnames/create"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
                >
                  <TaskIcon className="h-4 w-4" />
                  Buat stock opname
                </Link>
              ) : null}
              {hasCapability("inventory.transfer") ? (
                <Link
                  to="/stock-transfers/outgoing"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <PaperPlaneIcon className="h-4 w-4" />
                  Transfer stok keluar
                </Link>
              ) : null}
            </div>
            {hasCapability("inventory.opname") ? (
              <Link
                to="/stock-opnames"
                className="inline-flex items-center gap-1.5 px-1 text-xs font-medium text-gray-500 transition hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-300"
              >
                <DocsIcon className="h-3.5 w-3.5" />
                Riwayat opname
              </Link>
            ) : null}
          </div>
        }
      >
        {isLoading ? (
          <AppLoader label="Memuat inventory..." />
        ) : shouldShowOutletPrompt ? (
          <EmptyState
            title="Pilih outlet terlebih dahulu"
            description="Owner perlu menentukan outlet operasional agar inventory, opname, dan transfer stok memakai konteks yang benar."
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Belum ada data stok"
            description="Belum ada item inventory yang cocok dengan filter saat ini pada outlet aktif."
            action={
              hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  Reset filter
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative w-full sm:max-w-sm">
                    <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          applySearch();
                        }
                      }}
                      placeholder="Cari nama, SKU, atau barcode..."
                      className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-9 text-sm text-gray-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                    />
                    {search ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          setAppliedSearch("");
                        }}
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
                  <button
                    type="button"
                    onClick={applySearch}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Terapkan
                  </button>
                  <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800">
                    <input
                      type="checkbox"
                      checked={includeZeroStock}
                      onChange={(event) => setIncludeZeroStock(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 accent-brand-500"
                    />
                    Tampilkan stok 0
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <p className="whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400">
                    {items.length} item
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
                {(
                  [
                    { value: "all", label: "Semua stok" },
                    { value: "low", label: "Stok rendah" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStockMode(option.value)}
                    aria-pressed={stockMode === option.value}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 ${
                      stockMode === option.value
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {view === "list" ? (
              /* ------------------------------ List view ------------------------------ */
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((item) => {
                  const key = `${item.productId}::${item.productVariantId ?? "base"}`;
                  const canTrack = item.trackingMode === "batch" || item.trackingMode === "serial";

                  return (
                    <li
                      key={key}
                      className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-gray-50/80 dark:hover:bg-white/[0.02] sm:px-6 lg:flex-row lg:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${accentFor(
                            item.productName,
                          )}`}
                        >
                          {item.productName.trim().charAt(0).toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {item.productName}
                            </p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getConsignmentTone(
                                item.isConsignment,
                              )}`}
                            >
                              {getConsignmentLabel(item.isConsignment)}
                            </span>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                              {trackingLabels[item.trackingMode]}
                            </span>
                            {item.costPrice > item.basePrice ? (
                              <span className="rounded-full bg-error-50 px-2 py-0.5 text-[11px] font-semibold text-error-700 dark:bg-error-500/10 dark:text-error-300">
                                Margin negatif
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-medium">{item.sku}</span>
                            <span className="text-gray-300 dark:text-gray-700">&bull;</span>
                            <span>{item.categoryName}</span>
                            <span className="text-gray-300 dark:text-gray-700">&bull;</span>
                            <span>{item.barcode ?? "Tanpa barcode"}</span>
                            <span className="text-gray-300 dark:text-gray-700">&bull;</span>
                            <span title={formatDateTime(item.updatedAt)}>
                              Diperbarui {formatDate(item.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex w-full flex-col gap-2 pl-14 lg:w-auto lg:flex-row lg:items-center lg:gap-4 lg:pl-0">
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-base font-semibold text-gray-900 dark:text-white">
                              {formatQuantity(item.qtyOnHand)}
                              <span className="ml-1 text-xs font-normal text-gray-400">
                                {item.unit}
                              </span>
                            </p>
                            <p className="text-[11px] text-gray-400">
                              Min. {formatQuantity(item.minStockAlert)}
                            </p>
                          </div>
                          <StockStatusBadge
                            qtyOnHand={item.qtyOnHand}
                            minStockAlert={item.minStockAlert}
                            isLowStock={item.isLowStock}
                          />
                        </div>

                        <div className="flex shrink-0 items-center gap-1 self-end lg:self-auto">
                          {canTrack ? (
                            <button
                              type="button"
                              disabled={isLoadingTracking}
                              onClick={() => void openTrackingDetail(item)}
                              aria-label={`Detail ${item.trackingMode} ${item.productName}`}
                              title={`Detail ${item.trackingMode}`}
                              className={`${actionButtonBase} hover:bg-brand-50 hover:text-brand-600 focus-visible:ring-brand-500/20 disabled:opacity-50 dark:hover:bg-brand-500/10 dark:hover:text-brand-300`}
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              /* ------------------------------ Grid view ------------------------------ */
              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
                {items.map((item) => {
                  const key = `${item.productId}::${item.productVariantId ?? "base"}`;
                  const canTrack = item.trackingMode === "batch" || item.trackingMode === "serial";

                  return (
                    <article
                      key={key}
                      className="group flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-theme-xs transition-shadow hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold ${accentFor(
                            item.productName,
                          )}`}
                        >
                          {item.productName.trim().charAt(0).toUpperCase() || "?"}
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          {canTrack ? (
                            <button
                              type="button"
                              disabled={isLoadingTracking}
                              onClick={() => void openTrackingDetail(item)}
                              aria-label={`Detail ${item.trackingMode} ${item.productName}`}
                              title={`Detail ${item.trackingMode}`}
                              className={`${actionButtonBase} hover:bg-brand-50 hover:text-brand-600 focus-visible:ring-brand-500/20 disabled:opacity-50 dark:hover:bg-brand-500/10 dark:hover:text-brand-300`}
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 min-w-0">
                        <p className="line-clamp-2 text-base font-semibold text-gray-900 dark:text-white">
                          {item.productName}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                          {item.categoryName}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getConsignmentTone(
                              item.isConsignment,
                            )}`}
                          >
                            {getConsignmentLabel(item.isConsignment)}
                          </span>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            {trackingLabels[item.trackingMode]}
                          </span>
                          {item.costPrice > item.basePrice ? (
                            <span className="rounded-full bg-error-50 px-2 py-0.5 text-[11px] font-semibold text-error-700 dark:bg-error-500/10 dark:text-error-300">
                              Margin negatif
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                            Stok saat ini
                          </p>
                          <p className="mt-0.5 text-lg font-semibold text-gray-900 dark:text-white">
                            {formatQuantity(item.qtyOnHand)}
                            <span className="ml-1 text-xs font-normal text-gray-400">
                              {item.unit}
                            </span>
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Min. {formatQuantity(item.minStockAlert)}
                          </p>
                        </div>
                        <StockStatusBadge
                          qtyOnHand={item.qtyOnHand}
                          minStockAlert={item.minStockAlert}
                          isLowStock={item.isLowStock}
                        />
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                        <span className="truncate font-medium">{item.sku}</span>
                        <span className="truncate" title={formatDateTime(item.updatedAt)}>
                          {formatDate(item.updatedAt)}
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

      <Modal
        isOpen={Boolean(trackingDetail)}
        onClose={() => setTrackingDetail(null)}
        className="max-w-2xl p-6 sm:p-8"
      >
        {trackingDetail ? (
          <div className="space-y-5">
            <div className="flex items-start gap-4 pr-10">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                <ListIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600">
                  Detail tracking
                </p>
                <h3 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                  {trackingDetail.item.productName}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {trackingDetail.item.sku} · {trackingDetail.item.categoryName}
                </p>
              </div>
            </div>

            {trackingDetail.item.trackingMode === "batch" ? (
              trackingDetail.options.batches.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  Belum ada batch untuk produk ini.
                </p>
              ) : (
                <div className="space-y-2">
                  {trackingDetail.options.batches.map((batch) => {
                    const expired =
                      batch.expiryDate !== null &&
                      new Date(batch.expiryDate).getTime() < new Date().setHours(0, 0, 0, 0);

                    return (
                      <div
                        key={batch.id}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 p-3.5 dark:border-gray-800"
                      >
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {batch.batchNumber}
                          </p>
                          <p
                            className={`mt-0.5 text-xs ${
                              expired
                                ? "text-error-600 dark:text-error-400"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {batch.expiryDate
                              ? `Exp ${new Date(batch.expiryDate).toLocaleDateString("id-ID")}`
                              : "Tanpa kedaluwarsa"}
                            {expired ? " · Kedaluwarsa" : ""}
                          </p>
                        </div>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                          {formatQuantity(batch.qtyRemaining)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )
            ) : trackingDetail.options.serials.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                Tidak ada serial tersedia untuk produk ini.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {trackingDetail.options.serials.map((serial) => (
                  <span
                    key={serial.id}
                    className="rounded-xl border border-gray-200 px-3 py-1.5 font-mono text-xs text-gray-900 dark:border-gray-800 dark:text-white"
                  >
                    {serial.serialNumber}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </ProtectedPageShell>
  );
}

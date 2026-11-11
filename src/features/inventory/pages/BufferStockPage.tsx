import { useEffect, useMemo, useState } from "react";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, InlineAlert } from "../../../components/ui";
import { Modal } from "../../../components/ui/modal";
import {
  ArrowRightIcon,
  BoxIcon,
  CheckLineIcon,
  ErrorIcon,
  PencilIcon,
  PieChartIcon,
} from "../../../icons";
import { accentFor } from "../../../utils/accent";
import { getErrorMessage } from "../../../utils/errors";
import { useRealtime } from "../../../lib/realtime/hooks";
import { getBufferStocks, updateBufferStock } from "../api/bufferStockApi";
import { useStockOutletScope } from "../hooks/useStockOutletScope";
import type { BufferStockItem } from "../types/bufferStock";
import { calculateAvailableOnline, getBufferStockKey } from "../types/bufferStock";
import { formatDateTime, formatQuantity } from "../utils/presentation";

type StatusFilter = "all" | "available" | "unavailable";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
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

function AvailabilityRing({ available, unavailable }: { available: number; unavailable: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const total = available + unavailable;
  const gap = available > 0 && unavailable > 0 ? 4 : 0;
  const availableLength = total ? Math.max((available / total) * circumference - gap, 0) : 0;
  const unavailableLength = total ? Math.max((unavailable / total) * circumference - gap, 0) : 0;

  return (
    <div className="relative h-40 w-40 shrink-0">
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full -rotate-90"
        role="img"
        aria-label="Perbandingan item tersedia dan tidak tersedia online"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="9"
          className="stroke-gray-100 dark:stroke-gray-800"
        />
        {availableLength > 0 ? (
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${availableLength} ${circumference}`}
            className="stroke-success-500 transition-all duration-500"
          />
        ) : null}
        {unavailableLength > 0 ? (
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${unavailableLength} ${circumference}`}
            strokeDashoffset={-(availableLength + gap)}
            className="stroke-error-500 transition-all duration-500"
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
          <BoxIcon className="h-7 w-7" />
        </div>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export default function BufferStockPage() {
  const {
    ownerMode,
    activeOutlets,
    selectedOutletId,
    setSelectedOutletId,
    effectiveOutletId,
  } = useStockOutletScope(true);
  const { onStockUpdate } = useRealtime();

  const [items, setItems] = useState<BufferStockItem[]>([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [onlyBuffered, setOnlyBuffered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editing, setEditing] = useState<BufferStockItem | null>(null);
  const [bufferInput, setBufferInput] = useState("0");
  const [isEnabledInput, setIsEnabledInput] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  async function loadBufferStocks() {
    if (!effectiveOutletId) {
      setItems([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getBufferStocks({
        outletId: effectiveOutletId,
        search: appliedSearch,
      });
      setItems(result);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat buffer stock."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadBufferStocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveOutletId, appliedSearch]);

  useEffect(() => {
    const unsubscribe = onStockUpdate((event) => {
      if (event.outletId === effectiveOutletId) {
        void loadBufferStocks();
      }
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveOutletId, onStockUpdate]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter === "available" && !item.isOnlineAvailable) return false;
      if (statusFilter === "unavailable" && item.isOnlineAvailable) return false;
      if (onlyBuffered && !(item.bufferQty > 0)) return false;
      return true;
    });
  }, [items, statusFilter, onlyBuffered]);

  const summary = useMemo(() => {
    const total = items.length;
    const unavailable = items.filter((i) => !i.isOnlineAvailable).length;
    const available = total - unavailable;
    const buffered = items.filter((i) => i.isEnabled && i.bufferQty > 0).length;
    const totalBuffer = items.reduce((sum, i) => sum + (i.isEnabled ? i.bufferQty : 0), 0);
    return { total, available, unavailable, buffered, totalBuffer };
  }, [items]);

  const categoryCoverage = useMemo(() => {
    const categories = new Map<string, { total: number; buffered: number }>();

    for (const item of items) {
      const current = categories.get(item.categoryName) ?? { total: 0, buffered: 0 };
      current.total += 1;
      if (item.isEnabled && item.bufferQty > 0) current.buffered += 1;
      categories.set(item.categoryName, current);
    }

    return [...categories.entries()]
      .map(([name, counts]) => ({ name, ...counts }))
      .sort((a, b) => b.buffered - a.buffered || b.total - a.total)
      .slice(0, 4);
  }, [items]);

  const statusCounts = useMemo(
    () => ({
      all: items.length,
      available: items.filter((item) => item.isOnlineAvailable).length,
      unavailable: items.filter((item) => !item.isOnlineAvailable).length,
    }),
    [items],
  );

  const shouldShowOutletPrompt = ownerMode && !effectiveOutletId;
  const hasActiveFilters = Boolean(appliedSearch) || statusFilter !== "all" || onlyBuffered;

  function resetFilters() {
    setSearch("");
    setAppliedSearch("");
    setStatusFilter("all");
    setOnlyBuffered(false);
  }

  function openEditModal(item: BufferStockItem) {
    setEditing(item);
    setBufferInput(String(item.bufferQty ?? 0));
    setIsEnabledInput(item.isEnabled);
    setModalError(null);
    setSuccess(null);
  }

  function closeEditModal() {
    if (isSaving) return;
    setEditing(null);
    setModalError(null);
  }

  const previewAvailable = useMemo(() => {
    if (!editing) return 0;
    const parsed = Number(bufferInput || 0);
    if (Number.isNaN(parsed)) return editing.availableOnlineQty;
    return calculateAvailableOnline(editing.qtyOnHand, parsed, isEnabledInput, editing.qtyReserved);
  }, [editing, bufferInput, isEnabledInput]);

  const bufferExceedsStock =
    editing != null && Number(bufferInput || 0) > editing.qtyAvailable && isEnabledInput;

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!editing || !effectiveOutletId) return;

    const parsed = Number(bufferInput);
    if (Number.isNaN(parsed) || parsed < 0) {
      setModalError("Buffer stock harus berupa angka 0 atau lebih.");
      return;
    }

    if (Math.round(parsed * 100) !== parsed * 100) {
      setModalError("Buffer stock maksimal 2 angka desimal.");
      return;
    }

    setIsSaving(true);
    setModalError(null);

    try {
      const updated = await updateBufferStock(editing.productId, {
        outletId: effectiveOutletId,
        productId: editing.productId,
        productVariantId: editing.productVariantId,
        bufferQty: parsed,
        isEnabled: isEnabledInput,
      });

      setItems((prev) =>
        prev.map((row) => (getBufferStockKey(row) === getBufferStockKey(updated) ? updated : row)),
      );
      setSuccess(
        `Buffer ${updated.productName}${updated.variantName ? ` (${updated.variantName})` : ""} disimpan. Stok online: ${updated.availableOnlineQty}.`,
      );
      setEditing(null);
    } catch (requestError) {
      setModalError(getErrorMessage(requestError, "Gagal menyimpan buffer stock."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Buffer Stock"
      description="Atur stok pengaman per outlet, produk, dan varian agar tidak dipublikasikan ke platform online seperti GoFood dan GrabFood. Rumus: stok online = max(0, stok fisik - buffer)."
    >
      <InlineAlert tone="error" message={error} />
      <InlineAlert tone="success" message={success} />

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
            <AvailabilityRing
              available={summary.available}
              unavailable={summary.unavailable}
            />
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-gray-600 dark:text-gray-300">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-success-500" />
                Tersedia online
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-error-500" />
                Tidak tersedia
              </span>
            </div>
          </div>

          <div className="grid gap-3">
            {[
              {
                label: "Total item",
                value: summary.total,
                icon: <BoxIcon className="h-5 w-5" />,
                iconClass:
                  "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300",
              },
              {
                label: "Total buffer aktif",
                value: formatQuantity(summary.totalBuffer),
                icon: <PieChartIcon className="h-5 w-5" />,
                iconClass:
                  "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-300",
              },
              {
                label: "Tidak tersedia online",
                value: summary.unavailable,
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
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Cakupan buffer per kategori
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Item yang sudah memiliki buffer aktif.
                </p>
              </div>
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                {summary.buffered} item
              </span>
            </div>

            {categoryCoverage.length === 0 ? (
              <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">
                Belum ada item untuk menampilkan cakupan buffer.
              </p>
            ) : (
              <ul className="mt-4 space-y-3.5">
                {categoryCoverage.map((category) => {
                  const percentage = category.total
                    ? Math.round((category.buffered / category.total) * 100)
                    : 0;

                  return (
                    <li key={category.name}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <span className="truncate font-medium text-gray-700 dark:text-gray-200">
                          {category.name}
                        </span>
                        <span className="shrink-0 text-gray-500 dark:text-gray-400">
                          {category.buffered}/{category.total} item
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-brand-500 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      <AppTableShell
        title="Daftar buffer stock"
        description="Atur porsi stok yang disimpan agar tidak ikut dipublikasikan ke kanal online."
        actions={
          ownerMode ? (
            <select
              value={selectedOutletId ?? ""}
              onChange={(event) => setSelectedOutletId(event.target.value || null)}
              aria-label="Outlet buffer stock"
              className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            >
              <option value="">Pilih outlet</option>
              {activeOutlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
          ) : undefined
        }
      >
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-sm">
                <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") setAppliedSearch(search);
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
                onClick={() => setAppliedSearch(search)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Terapkan
              </button>
              <label
                className={`flex h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 text-xs font-medium transition ${
                  onlyBuffered
                    ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <input
                  type="checkbox"
                  checked={onlyBuffered}
                  onChange={(event) => setOnlyBuffered(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-brand-500"
                />
                Hanya ada buffer
              </label>
            </div>

            <p className="whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400">
              {filteredItems.length} dari {items.length} item
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "all", label: "Semua" },
                { value: "available", label: "Tersedia online" },
                { value: "unavailable", label: "Tidak tersedia" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                aria-pressed={statusFilter === option.value}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 ${
                  statusFilter === option.value
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                {option.label}
                <span
                  className={`rounded-full px-1.5 text-[10px] font-semibold ${
                    statusFilter === option.value
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {statusCounts[option.value]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <AppLoader label="Memuat buffer stock..." />
        ) : shouldShowOutletPrompt ? (
          <EmptyState
            title="Pilih outlet terlebih dahulu"
            description="Owner perlu menentukan outlet operasional agar buffer stock memakai konteks yang benar."
          />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="Belum ada data buffer stock"
            description="Belum ada item yang cocok dengan filter saat ini pada outlet aktif."
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
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredItems.map((item) => (
              <li
                key={getBufferStockKey(item)}
                className="group flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-gray-50/80 dark:hover:bg-white/[0.02] sm:px-6 xl:flex-row xl:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-semibold ${accentFor(
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
                      {item.variantName ? (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          {item.variantName}
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          item.isOnlineAvailable
                            ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300"
                            : "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-300"
                        }`}
                      >
                        {item.isOnlineAvailable ? "Tersedia online" : "Tidak tersedia"}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">{item.sku}</span>
                      <span className="text-gray-300 dark:text-gray-700">&bull;</span>
                      <span>{item.categoryName}</span>
                      <span className="text-gray-300 dark:text-gray-700">&bull;</span>
                      <span>
                        {item.bufferUpdatedAt
                          ? `Buffer diperbarui ${formatDateTime(item.bufferUpdatedAt)}`
                          : "Buffer belum pernah diatur"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pl-15 sm:flex-row sm:items-center xl:pl-0">
                  <div className="grid min-w-0 grid-cols-[minmax(72px,1fr)_auto_minmax(72px,1fr)_auto_minmax(82px,1fr)] items-center rounded-2xl border border-gray-100 bg-gray-50/80 px-3 py-2.5 dark:border-gray-800 dark:bg-gray-950/60 sm:min-w-[390px]">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                        Stok fisik
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">
                        {formatQuantity(item.qtyOnHand)} {item.unit}
                      </p>
                    </div>
                    <span className="px-2 text-gray-300 dark:text-gray-700">−</span>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                        Buffer
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-warning-600 dark:text-warning-300">
                        {item.isEnabled ? formatQuantity(item.bufferQty) : "Nonaktif"}
                      </p>
                    </div>
                    <ArrowRightIcon className="mx-2 h-4 w-4 text-gray-300 dark:text-gray-700" />
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                        Online
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-brand-600 dark:text-brand-300">
                        {formatQuantity(item.availableOnlineQty)} {item.unit}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 px-3.5 text-xs font-semibold text-gray-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 dark:border-gray-800 dark:text-gray-200 dark:hover:border-brand-800 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Atur buffer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppTableShell>

      {editing ? (
        <Modal
          isOpen
          onClose={closeEditModal}
          className="mx-4 max-w-2xl overflow-hidden shadow-2xl"
        >
          <form onSubmit={handleSave} className="flex max-h-[90vh] flex-col">
            <div className="relative shrink-0 overflow-hidden border-b border-gray-100 bg-gradient-to-br from-brand-50 via-white to-white px-6 py-6 pr-20 dark:border-gray-800 dark:from-brand-500/10 dark:via-gray-900 dark:to-gray-900 sm:px-8 sm:py-7">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full bg-brand-500/15 blur-2xl"
              />
              <div className="relative flex items-center gap-4">
                <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/25">
                  <BoxIcon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Atur buffer stock
                  </h3>
                  <p className="mt-1 truncate text-sm text-gray-600 dark:text-gray-300">
                    {editing.productName}
                    {editing.variantName ? ` · ${editing.variantName}` : ""} · SKU {editing.sku}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6 sm:px-8">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
                {[
                  {
                    label: "Stok fisik",
                    value: formatQuantity(editing.qtyOnHand),
                    tone: "text-gray-900 dark:text-white",
                  },
                  {
                    label: "Buffer baru",
                    value: isEnabledInput
                      ? formatQuantity(Number(bufferInput || 0))
                      : "Nonaktif",
                    tone: "text-warning-600 dark:text-warning-300",
                  },
                  {
                    label: "Tersedia online",
                    value: formatQuantity(previewAvailable),
                    tone: "text-brand-600 dark:text-brand-300",
                  },
                ].map((metric, index) => (
                  <div key={metric.label} className="contents">
                    {index > 0 ? (
                      <ArrowRightIcon className="hidden h-4 w-4 text-gray-300 dark:text-gray-700 sm:block" />
                    ) : null}
                    <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{metric.label}</p>
                      <p className={`mt-1 text-xl font-semibold ${metric.tone}`}>
                        {metric.value}
                        {metric.value !== "Nonaktif" ? (
                          <span className="ml-1 text-xs font-normal text-gray-400">
                            {editing.unit}
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label
                  htmlFor="buffer-stock-input"
                  className="text-sm font-semibold text-gray-800 dark:text-gray-200"
                >
                  Jumlah buffer
                </label>
                <div className="relative mt-2">
                  <input
                    id="buffer-stock-input"
                    type="number"
                    min={0}
                    step="0.01"
                    value={bufferInput}
                    onChange={(event) => setBufferInput(event.target.value)}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 pr-16 text-base font-semibold text-gray-900 outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                    {editing.unit}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  Stok online = stok fisik dikurangi buffer, minimum 0. Perubahan ini tidak
                  mengubah stok fisik dan tidak mencatat mutasi stok.
                </p>
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-gray-200 p-4 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                <span>
                  <span className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Buffer aktif
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                    Jika nonaktif, seluruh stok fisik akan dianggap tersedia online.
                  </span>
                </span>
                <span className="relative shrink-0">
                  <input
                    type="checkbox"
                    checked={isEnabledInput}
                    onChange={(event) => setIsEnabledInput(event.target.checked)}
                    className="peer sr-only"
                  />
                  <span className="block h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-brand-500 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/20 dark:bg-gray-700" />
                  <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                </span>
              </label>

              {bufferExceedsStock ? (
                <div className="flex gap-3 rounded-2xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-300">
                  <ErrorIcon className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Buffer melebihi stok fisik</p>
                    <p className="mt-0.5 text-xs leading-5">
                      Produk akan menjadi tidak tersedia di platform online sampai stok fisiknya
                      bertambah atau buffer dikurangi.
                    </p>
                  </div>
                </div>
              ) : null}

              {modalError ? <InlineAlert tone="error" message={modalError} /> : null}
            </div>

            <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:justify-end sm:px-8">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-500/10 disabled:opacity-60 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckLineIcon className="h-4 w-4" />
                {isSaving ? "Menyimpan..." : "Simpan buffer"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </ProtectedPageShell>
  );
}

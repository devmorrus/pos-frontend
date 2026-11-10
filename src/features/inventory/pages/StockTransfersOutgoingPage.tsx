import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, InlineAlert } from "../../../components/ui";
import { ArrowUpIcon, EyeIcon, PlusIcon } from "../../../icons";
import { getErrorMessage } from "../../../utils/errors";
import { getInventory, createStockTransfer, getOutgoingStockTransfers } from "../api/inventoryApi";
import TransferCreateModal from "../components/TransferCreateModal";
import {
  StockTransfersSummary,
  StockTransfersTabs,
  StockTransfersToolbar,
  TransferEmptyState,
  type TransferStatusFilter,
} from "../components/StockTransfersUi";
import { useStockOutletScope } from "../hooks/useStockOutletScope";
import type { InventoryListItem, StockTransferDto } from "../types/inventory";
import {
  formatDateTime,
  getTransferStatusBucket,
  getTransferStatusLabel,
  getTransferStatusTone,
} from "../utils/presentation";

export default function StockTransfersOutgoingPage() {
  const { ownerMode, activeOutlets, effectiveOutletId } = useStockOutletScope();
  const [items, setItems] = useState<StockTransferDto[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TransferStatusFilter>("all");

  async function loadPage() {
    if (!effectiveOutletId) {
      setItems([]);
      setInventoryItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [transfersResult, inventoryResult] = await Promise.all([
        getOutgoingStockTransfers(effectiveOutletId),
        getInventory({ stockLocationId: effectiveOutletId, includeZeroStock: false }),
      ]);

      setItems(transfersResult);
      setInventoryItems(inventoryResult);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat transfer stok keluar."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [effectiveOutletId]);

  async function handleCreateTransfer(payload: Parameters<typeof createStockTransfer>[0]) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createStockTransfer(payload);
      setCreateOpen(false);
      setSuccessMessage(`Transfer ${result.transferNumber} berhasil diajukan.`);
      await loadPage();
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError, "Gagal mengajukan transfer stok."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const statusCounts = useMemo(() => {
    const counts: Record<TransferStatusFilter, number> = {
      all: items.length,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    for (const item of items) {
      counts[getTransferStatusBucket(item.status)] += 1;
    }

    return counts;
  }, [items]);

  const normalizedQuery = search.trim().toLowerCase();
  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (
          statusFilter !== "all" &&
          getTransferStatusBucket(item.status) !== statusFilter
        ) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return (
          item.transferNumber.toLowerCase().includes(normalizedQuery) ||
          item.toStockLocationName.toLowerCase().includes(normalizedQuery) ||
          item.requestedByName.toLowerCase().includes(normalizedQuery)
        );
      }),
    [items, statusFilter, normalizedQuery],
  );

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
  }

  return (
    <ProtectedPageShell
      title="Transfer Stok"
      description="Kelola perpindahan stok antar cabang/outlet (Transfer Keluar dan Transfer Masuk)."
    >
      <StockTransfersTabs active="outgoing" />

      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      <StockTransfersSummary
        pending={statusCounts.pending}
        approved={statusCounts.approved}
        rejected={statusCounts.rejected}
      />

      <AppTableShell
        title="Transfer keluar"
        description="Permintaan transfer stok yang diajukan dari outlet aktif."
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
          >
            <PlusIcon className="h-4 w-4" />
            Buat transfer
          </button>
        }
      >
        {isLoading ? (
          <AppLoader label="Memuat transfer stok keluar..." />
        ) : ownerMode && !effectiveOutletId ? (
          <TransferEmptyState
            title="Pilih outlet terlebih dahulu"
            description="Owner perlu memilih outlet asal sebelum melihat atau membuat transfer stok keluar."
            tone="muted"
          />
        ) : items.length === 0 ? (
          <TransferEmptyState
            title="Belum ada transfer keluar"
            description="Belum ada transfer stok yang diajukan dari outlet aktif. Buat transfer pertama untuk memindahkan stok ke outlet lain."
            action={
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                <PlusIcon className="h-4 w-4" />
                Buat transfer pertama
              </button>
            }
          />
        ) : (
          <>
            <StockTransfersToolbar
              search={search}
              onSearchChange={setSearch}
              status={statusFilter}
              onStatusChange={setStatusFilter}
              counts={statusCounts}
              visibleCount={filteredItems.length}
              totalCount={items.length}
            />

            {filteredItems.length === 0 ? (
              <TransferEmptyState
                title="Transfer tidak ditemukan"
                description="Tidak ada transfer keluar yang cocok dengan pencarian atau filter status saat ini."
                action={
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Reset filter
                  </button>
                }
              />
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredItems.map((item) => (
                  <li
                    key={item.id}
                    className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-gray-50/80 dark:hover:bg-white/[0.02] sm:px-6 lg:flex-row lg:items-center"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                        <ArrowUpIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                            {item.transferNumber}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getTransferStatusTone(
                              item.status,
                            )}`}
                          >
                            {getTransferStatusLabel(item.status)}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium text-gray-700 dark:text-gray-200">
                            {item.toStockLocationName}
                          </span>
                          <span className="text-gray-300 dark:text-gray-700">&bull;</span>
                          <span>Oleh {item.requestedByName}</span>
                          <span className="text-gray-300 dark:text-gray-700">&bull;</span>
                          <span>{formatDateTime(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 pl-14 lg:justify-end lg:pl-0">
                      <div className="text-right">
                        <p className="text-base font-semibold text-gray-900 dark:text-white">
                          {item.items.length}
                        </p>
                        <p className="whitespace-nowrap text-[11px] text-gray-400">jenis item</p>
                      </div>
                      <Link
                        to={`/stock-transfers/${item.id}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        <EyeIcon className="h-4 w-4" />
                        Detail
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </AppTableShell>

      <TransferCreateModal
        open={createOpen}
        fromOutletId={effectiveOutletId}
        outlets={activeOutlets}
        inventoryItems={inventoryItems}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onClose={() => {
          if (!isSubmitting) {
            setCreateOpen(false);
          }
        }}
        onSubmit={handleCreateTransfer}
      />
    </ProtectedPageShell>
  );
}

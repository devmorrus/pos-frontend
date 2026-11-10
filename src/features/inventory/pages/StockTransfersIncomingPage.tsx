import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, ConfirmDialog, InlineAlert } from "../../../components/ui";
import {
  ArrowDownIcon,
  CheckLineIcon,
  CloseLineIcon,
  EyeIcon,
} from "../../../icons";
import { getErrorMessage } from "../../../utils/errors";
import {
  approveStockTransfer,
  getIncomingStockTransfers,
  rejectStockTransfer,
} from "../api/inventoryApi";
import {
  StockTransfersSummary,
  StockTransfersTabs,
  StockTransfersToolbar,
  TransferEmptyState,
  type TransferStatusFilter,
} from "../components/StockTransfersUi";
import { useStockOutletScope } from "../hooks/useStockOutletScope";
import type { StockTransferDto } from "../types/inventory";
import {
  formatDateTime,
  getTransferStatusBucket,
  getTransferStatusLabel,
  getTransferStatusTone,
} from "../utils/presentation";

export default function StockTransfersIncomingPage() {
  const { ownerMode, effectiveOutletId } = useStockOutletScope();
  const [items, setItems] = useState<StockTransferDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<{
    item: StockTransferDto;
    action: "approve" | "reject";
  } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TransferStatusFilter>("all");

  async function loadTransfers() {
    if (!effectiveOutletId) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setItems(await getIncomingStockTransfers(effectiveOutletId));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat transfer stok incoming."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadTransfers();
  }, [effectiveOutletId]);

  async function handleConfirmAction() {
    if (!actionTarget) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (actionTarget.action === "approve") {
        const result = await approveStockTransfer(actionTarget.item.id);
        setSuccessMessage(`Transfer ${result.transferNumber} berhasil di-approve.`);
      } else {
        const result = await rejectStockTransfer(actionTarget.item.id);
        setSuccessMessage(`Transfer ${result.transferNumber} berhasil di-reject.`);
      }

      setActionTarget(null);
      await loadTransfers();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memproses aksi transfer stok."));
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
          item.fromStockLocationName.toLowerCase().includes(normalizedQuery) ||
          item.requestedByName.toLowerCase().includes(normalizedQuery) ||
          (item.approvedByName ?? "").toLowerCase().includes(normalizedQuery)
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
      <StockTransfersTabs active="incoming" />

      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      <StockTransfersSummary
        pending={statusCounts.pending}
        approved={statusCounts.approved}
        rejected={statusCounts.rejected}
      />

      <AppTableShell
        title="Transfer masuk"
        description="Permintaan transfer stok yang masuk ke outlet aktif."
      >
        {isLoading ? (
          <AppLoader label="Memuat transfer stok incoming..." />
        ) : ownerMode && !effectiveOutletId ? (
          <TransferEmptyState
            title="Pilih outlet terlebih dahulu"
            description="Owner perlu memilih outlet tujuan sebelum melihat transfer stok masuk."
            tone="muted"
          />
        ) : items.length === 0 ? (
          <TransferEmptyState
            title="Belum ada transfer masuk"
            description="Belum ada transfer stok yang masuk ke outlet aktif. Permintaan dari outlet lain akan tampil di sini."
            tone="success"
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
                description="Tidak ada transfer masuk yang cocok dengan pencarian atau filter status saat ini."
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
                {filteredItems.map((item) => {
                  const canAction = getTransferStatusBucket(item.status) === "pending";

                  return (
                    <li
                      key={item.id}
                      className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-gray-50/80 dark:hover:bg-white/[0.02] sm:px-6 lg:flex-row lg:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-300">
                          <ArrowDownIcon className="h-5 w-5" />
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
                              {item.fromStockLocationName}
                            </span>
                            <span className="text-gray-300 dark:text-gray-700">&bull;</span>
                            <span>Oleh {item.requestedByName}</span>
                            <span className="text-gray-300 dark:text-gray-700">&bull;</span>
                            <span>{formatDateTime(item.createdAt)}</span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Approver: {item.approvedByName ?? "-"} &bull; {item.items.length} jenis
                            item
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pl-14 lg:justify-end lg:pl-0">
                        <Link
                          to={`/stock-transfers/${item.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          <EyeIcon className="h-4 w-4" />
                          Detail
                        </Link>
                        {canAction ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setActionTarget({ item, action: "approve" })}
                              aria-label={`Approve transfer ${item.transferNumber}`}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-success-200 bg-success-50 px-3 py-2 text-xs font-semibold text-success-700 transition hover:bg-success-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-success-500/20 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-300 dark:hover:bg-success-500/20"
                            >
                              <CheckLineIcon className="h-4 w-4" />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => setActionTarget({ item, action: "reject" })}
                              aria-label={`Reject transfer ${item.transferNumber}`}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-error-200 bg-error-50 px-3 py-2 text-xs font-semibold text-error-700 transition hover:bg-error-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-error-500/20 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-300 dark:hover:bg-error-500/20"
                            >
                              <CloseLineIcon className="h-4 w-4" />
                              Reject
                            </button>
                          </>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </AppTableShell>

      <ConfirmDialog
        open={Boolean(actionTarget)}
        title={actionTarget?.action === "approve" ? "Approve transfer stok" : "Reject transfer stok"}
        description={
          actionTarget?.action === "approve"
            ? "Approve akan memindahkan stok secara riil dari outlet asal ke outlet tujuan."
            : "Reject akan menutup permintaan transfer tanpa mengubah stok."
        }
        confirmLabel={actionTarget?.action === "approve" ? "Approve transfer" : "Reject transfer"}
        isBusy={isSubmitting}
        onCancel={() => setActionTarget(null)}
        onConfirm={() => void handleConfirmAction()}
      />
    </ProtectedPageShell>
  );
}

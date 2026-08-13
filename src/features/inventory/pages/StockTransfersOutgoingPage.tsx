import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { getInventory, createStockTransfer, getOutgoingStockTransfers } from "../api/inventoryApi";
import TransferCreateModal from "../components/TransferCreateModal";
import { useStockOutletScope } from "../hooks/useStockOutletScope";
import type { InventoryListItem, StockTransferDto } from "../types/inventory";
import { formatDateTime, getTransferStatusTone } from "../utils/presentation";

export default function StockTransfersOutgoingPage() {
  const { ownerMode, activeOutlets, effectiveOutletId } =
    useStockOutletScope();
  const [items, setItems] = useState<StockTransferDto[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

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
        getInventory({ outletId: effectiveOutletId, includeZeroStock: false }),
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

  const pendingCount = useMemo(
    () => items.filter((item) => item.status.toLowerCase() === "pending").length,
    [items],
  );

  return (
    <ProtectedPageShell
      title="Transfer Stok"
      description="Kelola perpindahan stok antar cabang/outlet (Transfer Keluar dan Transfer Masuk)."
    >
      <div className="mb-6 flex border-b border-gray-200 dark:border-gray-800">
        <Link
          to="/stock-transfers/outgoing"
          className="pb-3 px-4 text-sm font-semibold border-b-2 border-brand-500 text-brand-600 dark:text-brand-400"
        >
          Transfer Keluar
        </Link>
        <Link
          to="/stock-transfers/incoming"
          className="pb-3 px-4 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Transfer Masuk
        </Link>
      </div>

      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      <AppTableShell
        title="Outgoing transfer"
        description={`Total transfer: ${items.length} · Pending: ${pendingCount}`}
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Buat transfer
          </button>
        }
      >
        {isLoading ? (
          <AppLoader label="Memuat transfer stok keluar..." />
        ) : ownerMode && !effectiveOutletId ? (
          <div className="p-6">
            <PagePlaceholder
              title="Pilih outlet terlebih dahulu"
              description="Owner perlu memilih outlet asal sebelum melihat atau membuat transfer stok keluar."
              status="Outlet required"
            />
          </div>
        ) : items.length === 0 ? (
          <div className="p-6">
            <PagePlaceholder
              title="Belum ada transfer keluar"
              description="Belum ada transfer stok yang diajukan dari outlet aktif."
              status="Empty"
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                {["Nomor transfer", "Outlet tujuan", "Peminta", "Status", "Total item", "Aksi"].map((column) => (
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
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{item.transferNumber}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(item.createdAt ?? new Date().toISOString())}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{item.toOutletName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.requestedByName}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getTransferStatusTone(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.items.length}</td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/stock-transfers/${item.id}`}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

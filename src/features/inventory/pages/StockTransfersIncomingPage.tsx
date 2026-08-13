import { useEffect, useState } from "react";
import { Link } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, ConfirmDialog, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import {
  approveStockTransfer,
  getIncomingStockTransfers,
  rejectStockTransfer,
} from "../api/inventoryApi";
import { useStockOutletScope } from "../hooks/useStockOutletScope";
import type { StockTransferDto } from "../types/inventory";
import { getTransferStatusTone } from "../utils/presentation";

export default function StockTransfersIncomingPage() {
  const { ownerMode, effectiveOutletId } =
    useStockOutletScope();
  const [items, setItems] = useState<StockTransferDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<{ item: StockTransferDto; action: "approve" | "reject" } | null>(null);

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

  return (
    <ProtectedPageShell
      title="Transfer Stok"
      description="Kelola perpindahan stok antar cabang/outlet (Transfer Keluar dan Transfer Masuk)."
    >
      <div className="mb-6 flex border-b border-gray-200 dark:border-gray-800">
        <Link
          to="/stock-transfers/outgoing"
          className="pb-3 px-4 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Transfer Keluar
        </Link>
        <Link
          to="/stock-transfers/incoming"
          className="pb-3 px-4 text-sm font-semibold border-b-2 border-brand-500 text-brand-600 dark:text-brand-400"
        >
          Transfer Masuk
        </Link>
      </div>

      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      <AppTableShell
        title="Incoming transfer"
      >
        {isLoading ? (
          <AppLoader label="Memuat transfer stok incoming..." />
        ) : ownerMode && !effectiveOutletId ? (
          <div className="p-6">
            <PagePlaceholder
              title="Pilih outlet terlebih dahulu"
              description="Owner perlu memilih outlet tujuan sebelum melihat transfer stok masuk."
              status="Outlet required"
            />
          </div>
        ) : items.length === 0 ? (
          <div className="p-6">
            <PagePlaceholder
              title="Belum ada transfer incoming"
              description="Belum ada transfer stok yang masuk ke outlet aktif."
              status="Empty"
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                {["Nomor transfer", "Outlet asal", "Peminta", "Status", "Approver", "Aksi"].map((column) => (
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
              {items.map((item) => {
                const canAction = item.status.toLowerCase() === "pending";
                return (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.transferNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{item.fromOutletName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.requestedByName}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getTransferStatusTone(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.approvedByName ?? "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/stock-transfers/${item.id}`}
                          className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                        >
                          Detail
                        </Link>
                        {canAction ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setActionTarget({ item, action: "approve" })}
                              className="rounded-xl border border-success-200 px-3 py-2 text-xs font-semibold text-success-700 dark:border-success-500/20 dark:text-success-300"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => setActionTarget({ item, action: "reject" })}
                              className="rounded-xl border border-error-200 px-3 py-2 text-xs font-semibold text-error-700 dark:border-error-500/20 dark:text-error-300"
                            >
                              Reject
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

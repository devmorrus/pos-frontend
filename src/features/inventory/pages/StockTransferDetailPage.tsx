import { useEffect, useState } from "react";
import { useParams } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, ConfirmDialog, InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import {
  approveStockTransfer,
  getStockTransferById,
  rejectStockTransfer,
} from "../api/inventoryApi";
import type { StockTransferDto } from "../types/inventory";
import { getTransferStatusTone } from "../utils/presentation";

export default function StockTransferDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<StockTransferDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  async function loadDetail() {
    if (!id) {
      setError("ID transfer stok tidak valid.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setItem(await getStockTransferById(id));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat detail transfer stok."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDetail();
  }, [id]);

  async function handleAction() {
    if (!item || !action) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result =
        action === "approve"
          ? await approveStockTransfer(item.id)
          : await rejectStockTransfer(item.id);
      setItem(result);
      setSuccessMessage(
        action === "approve"
          ? `Transfer ${result.transferNumber} berhasil di-approve.`
          : `Transfer ${result.transferNumber} berhasil di-reject.`,
      );
      setAction(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memproses aksi transfer."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Detail Transfer Stok"
      description="Tinjau item transfer dan proses approval sesuai hak akses outlet tujuan."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      {isLoading ? (
        <AppLoader label="Memuat detail transfer stok..." />
      ) : !item ? null : (
        <>
          <section className="grid gap-6 lg:grid-cols-4">
            {[
              ["Nomor", item.transferNumber],
              ["Asal", item.fromOutletName],
              ["Tujuan", item.toOutletName],
              ["Peminta", item.requestedByName],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-3xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{label}</p>
                <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">{value}</p>
              </div>
            ))}
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Status</p>
                <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getTransferStatusTone(item.status)}`}>
                  {item.status}
                </span>
              </div>
              {item.status.toLowerCase() === "pending" ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAction("approve")}
                    className="rounded-xl border border-success-200 px-4 py-2 text-sm font-semibold text-success-700 dark:border-success-500/20 dark:text-success-300 hover:bg-success-50 dark:hover:bg-success-950/20"
                  >
                    Terima Barang
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction("reject")}
                    className="rounded-xl border border-error-200 px-4 py-2 text-sm font-semibold text-error-700 dark:border-error-500/20 dark:text-error-300 hover:bg-error-50 dark:hover:bg-error-950/20"
                  >
                    Tolak
                  </button>
                </div>
              ) : null}
            </div>
          </section>

          <AppTableShell
            title="Item transfer"
            description={`Total item: ${item.items.length}`}
          >
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-950">
                <tr>
                  {["SKU", "Produk", "Qty"].map((column) => (
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
                {item.items.map((row) => (
                  <tr key={`${row.productId}-${row.sku}`}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{row.sku}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{row.productName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{row.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AppTableShell>
        </>
      )}

      <ConfirmDialog
        open={Boolean(action)}
        title={action === "approve" ? "Persetujuan Penerimaan Barang" : "Tolak Transfer Stok"}
        description={
          action === "approve"
            ? "Stok akan dikonfirmasi telah diterima dan ditambahkan ke cabang tujuan."
            : "Transfer akan ditolak dan stok akan dikembalikan ke cabang asal."
        }
        confirmLabel={action === "approve" ? "Terima Barang" : "Tolak Transfer"}
        isBusy={isSubmitting}
        onCancel={() => setAction(null)}
        onConfirm={() => void handleAction()}
      />
    </ProtectedPageShell>
  );
}

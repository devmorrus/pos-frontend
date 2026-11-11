import { useEffect, useState } from "react";
import { useParams } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import {
  getStockTransferById,
  receiveStockTransfer,
} from "../api/inventoryApi";
import TransferReceiveModal from "../components/TransferReceiveModal";
import type { StockTransferDto } from "../types/inventory";
import { getTransferStatusTone } from "../utils/presentation";

export default function StockTransferDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<StockTransferDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [receiveOpen, setReceiveOpen] = useState(false);

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

  async function handleReceive(payload: Parameters<typeof receiveStockTransfer>[1]) {
    if (!item) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await receiveStockTransfer(item.id, payload);
      setItem(result);
      setSuccessMessage(`Transfer ${result.transferNumber} berhasil diterima${result.hasVariance ? " dengan selisih" : ""}.`);
      setReceiveOpen(false);
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
              ["Asal", item.fromStockLocationName],
              ["Tujuan", item.toStockLocationName],
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
               {["pending", "in_transit"].includes(item.status.toLowerCase()) ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                     onClick={() => setReceiveOpen(true)}
                    className="rounded-xl border border-success-200 px-4 py-2 text-sm font-semibold text-success-700 dark:border-success-500/20 dark:text-success-300 hover:bg-success-50 dark:hover:bg-success-950/20"
                  >
                     Periksa & Terima
                   </button>
                </div>
              ) : null}
            </div>
            {item.receivedAt && <p className="mt-4 text-sm text-gray-500">Diterima {new Date(item.receivedAt).toLocaleString("id-ID")} oleh {item.approvedByName ?? "-"}{item.receiptNote ? ` · ${item.receiptNote}` : ""}</p>}
          </section>

          <AppTableShell
            title="Item transfer"
            description={`Total item: ${item.items.length}`}
          >
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-950">
                <tr>
                  {["SKU", "Produk", "Batch / Serial", "Dikirim", "Diterima", "Selisih", "Keterangan"].map((column) => (
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
                {item.items.map((row, index) => (
                  <tr key={`${row.productId}-${row.productBatchId ?? row.productSerialId ?? index}`}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{row.sku}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{row.productName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {row.batchNumber
                        ? `${row.batchNumber}${row.expiryDate ? ` · exp ${new Date(row.expiryDate).toLocaleDateString("id-ID")}` : ""}`
                        : row.serialNumber ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{row.sentQty ?? row.qty}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{row.receivedQty ?? "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{row.differenceQty ?? "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{row.varianceNote ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AppTableShell>
        </>
      )}

      <TransferReceiveModal open={receiveOpen} transfer={item} isSubmitting={isSubmitting} submitError={error} onClose={() => !isSubmitting && setReceiveOpen(false)} onSubmit={handleReceive} />
    </ProtectedPageShell>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, ConfirmDialog, InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { getConsignmentReturnById, updateConsignmentReturnStatus } from "../api/consignmentsApi";
import type { ConsignmentReturnDto } from "../types/consignment";
import { formatDateTime } from "../utils/formatters";
import { getConsignmentReturnStatusClasses } from "./ConsignmentReturnsPage";

type ConsignmentReturnDetailLocationState = {
  successMessage?: string;
};

const statusActions: Record<string, { label: string; nextStatus: string }[]> = {
  draft: [
    { label: "Selesaikan retur", nextStatus: "completed" },
    { label: "Batalkan", nextStatus: "cancelled" },
  ],
};

export default function ConsignmentReturnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [consignmentReturn, setConsignmentReturn] = useState<ConsignmentReturnDto | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as ConsignmentReturnDetailLocationState | null)?.successMessage ?? null,
  );

  async function loadReturn() {
    if (!id) {
      setError("Retur barang konsinyasi tidak valid.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setConsignmentReturn(await getConsignmentReturnById(id));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat detail retur konsinyasi."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadReturn();
  }, [id]);

  const availableActions = useMemo(
    () => (consignmentReturn ? statusActions[consignmentReturn.status] ?? [] : []),
    [consignmentReturn],
  );

  const totalQty = useMemo(
    () => consignmentReturn?.items.reduce((total, item) => total + item.qty, 0) ?? 0,
    [consignmentReturn],
  );

  async function handleStatusConfirm() {
    if (!id || !pendingStatus) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateConsignmentReturnStatus(id, { status: pendingStatus });
      setConsignmentReturn(result);
      setSuccessMessage(
        `Status retur ${result.returnNumber} berhasil diubah menjadi ${pendingStatus}.`,
      );
      setPendingStatus(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal mengubah status retur konsinyasi."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <ProtectedPageShell title="Detail Retur Konsinyasi" description="Memuat detail...">
        <AppLoader label="Memuat detail retur konsinyasi..." />
      </ProtectedPageShell>
    );
  }

  if (!consignmentReturn) {
    return (
      <ProtectedPageShell title="Detail Retur Konsinyasi" description="Detail tidak ditemukan.">
        <InlineAlert tone="error" message={error ?? "Retur konsinyasi tidak ditemukan."} />
        <div className="mt-4">
          <Link to="/consignments/returns" className="text-sm font-semibold text-brand-500">
            &larr; Kembali ke daftar
          </Link>
        </div>
      </ProtectedPageShell>
    );
  }

  return (
    <ProtectedPageShell
      title="Detail Retur Konsinyasi"
      description="Tinjau detail barang yang dikembalikan ke supplier."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/consignments/returns" className="text-sm font-semibold text-brand-500 hover:underline">
            &larr; Kembali ke daftar
          </Link>

          <div className="flex gap-2">
            {availableActions.map((action) => (
              <button
                key={action.nextStatus}
                type="button"
                onClick={() => setPendingStatus(action.nextStatus)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                  action.nextStatus === "completed" ? "bg-success-600 hover:bg-success-700" : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 dark:border-gray-900 dark:bg-gray-950">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Informasi Retur</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">No. Retur</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{consignmentReturn.returnNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Tanggal</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{formatDateTime(consignmentReturn.returnDate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getConsignmentReturnStatusClasses(
                      consignmentReturn.status,
                    )}`}
                  >
                    {consignmentReturn.status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 dark:border-gray-900 dark:bg-gray-950">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pihak Terkait</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Supplier</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{consignmentReturn.supplierName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Outlet</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{consignmentReturn.outletName}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white overflow-hidden dark:border-gray-900 dark:bg-gray-950">
          <div className="p-6 border-b border-gray-100 dark:border-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Item</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                {["Produk", "SKU", "Qty Retur"].map((column) => (
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
              {consignmentReturn.items.map((item) => (
                <tr key={item.productId}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {item.productName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.sku}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.qty}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-gray-950 font-semibold">
              <tr>
                <td colSpan={2} className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  Total
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{totalQty}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={pendingStatus !== null}
        title={pendingStatus === "completed" ? "Selesaikan Retur?" : "Batalkan Dokumen Retur?"}
        description={
          pendingStatus === "completed"
            ? "Menyelesaikan retur akan mengurangi stok fisik produk konsinyasi di outlet ini secara permanen."
            : "Membatalkan dokumen retur akan menutup draft dokumen ini tanpa memengaruhi stok."
        }
        confirmLabel={pendingStatus === "completed" ? "Selesaikan" : "Batalkan"}
        isBusy={isSubmitting}
        onConfirm={() => void handleStatusConfirm()}
        onCancel={() => setPendingStatus(null)}
      />
    </ProtectedPageShell>
  );
}

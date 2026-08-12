import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, ConfirmDialog, InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { getConsignmentById, updateConsignmentStatus } from "../api/consignmentsApi";
import type { ConsignmentDto } from "../types/consignment";
import {
  formatCurrency,
  formatDateTime,
  getConsignmentStatusClasses,
} from "../utils/formatters";

type ConsignmentDetailLocationState = {
  successMessage?: string;
};

const statusActions: Record<string, { label: string; nextStatus: string }[]> = {
  draft: [
    { label: "Terima barang", nextStatus: "received" },
    { label: "Batalkan", nextStatus: "cancelled" },
  ],
};

export default function ConsignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [consignment, setConsignment] = useState<ConsignmentDto | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as ConsignmentDetailLocationState | null)?.successMessage ?? null,
  );

  async function loadConsignment() {
    if (!id) {
      setError("Tanda terima konsinyasi tidak valid.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setConsignment(await getConsignmentById(id));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat detail konsinyasi."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadConsignment();
  }, [id]);

  const availableActions = useMemo(
    () => (consignment ? statusActions[consignment.status] ?? [] : []),
    [consignment],
  );

  const totalCost = useMemo(
    () =>
      consignment?.items.reduce((total, item) => total + item.qty * item.unitCost, 0) ?? 0,
    [consignment],
  );

  async function handleStatusConfirm() {
    if (!id || !pendingStatus) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateConsignmentStatus(id, { status: pendingStatus });
      setConsignment(result);
      setSuccessMessage(
        `Status tanda terima ${result.consignmentNumber} berhasil diubah menjadi ${pendingStatus}.`,
      );
      setPendingStatus(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal mengubah status tanda terima konsinyasi."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Detail Tanda Terima Konsinyasi"
      description="Tinjau barang titipan supplier per outlet, lalu proses penerimaan stok konsinyasi jika sudah sesuai."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      {isLoading ? (
        <AppLoader label="Memuat detail konsinyasi..." />
      ) : !consignment ? null : (
        <div className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">No. konsinyasi</p>
                  <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                    {consignment.consignmentNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Supplier</p>
                  <p className="mt-2 text-base text-gray-700 dark:text-gray-200">
                    {consignment.supplierName}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Outlet</p>
                  <p className="mt-2 text-base text-gray-700 dark:text-gray-200">
                    {consignment.outletName}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Tanggal terima</p>
                  <p className="mt-2 text-base text-gray-700 dark:text-gray-200">
                    {formatDateTime(consignment.receiveDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Total item</p>
                  <p className="mt-2 text-base text-gray-700 dark:text-gray-200">
                    {consignment.items.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Estimasi nilai HPP</p>
                  <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(totalCost)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getConsignmentStatusClasses(
                    consignment.status,
                  )}`}
                >
                  {consignment.status}
                </span>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/consignments"
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                  >
                    Kembali ke daftar
                  </Link>
                  {availableActions.map((action) => (
                    <button
                      key={action.nextStatus}
                      type="button"
                      onClick={() => setPendingStatus(action.nextStatus)}
                      className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Item barang titipan</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-950">
                  <tr>
                    {["SKU", "Produk", "Diterima", "Terjual", "Retur", "Sisa Stok", "Unit Cost", "Unit Price", "Total Cost"].map((column) => (
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
                  {consignment.items.map((item) => (
                    <tr key={item.productId}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {item.sku}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                        {item.productName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.qty}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.soldQty ?? 0}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.returnedQty ?? 0}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                        {item.qty - (item.soldQty ?? 0) - (item.returnedQty ?? 0)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatCurrency(item.unitCost)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(item.qty * item.unitCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title="Ubah status tanda terima konsinyasi"
        description={`Anda yakin ingin mengubah status tanda terima ini menjadi ${pendingStatus ?? ""}?`}
        confirmLabel="Proses status"
        isBusy={isSubmitting}
        onCancel={() => setPendingStatus(null)}
        onConfirm={() => void handleStatusConfirm()}
      />
    </ProtectedPageShell>
  );
}
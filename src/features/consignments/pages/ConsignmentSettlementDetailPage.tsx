import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, ConfirmDialog, InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import {
  getConsignmentSettlementById,
  updateConsignmentSettlementStatus,
} from "../api/consignmentsApi";
import type { ConsignmentSettlementDto } from "../types/consignment";
import {
  formatCurrency,
  formatDateTime,
  getSettlementStatusClasses,
} from "../utils/formatters";
import AccountingPostingBadge from "../../accounting-integrations/components/AccountingPostingBadge";

type SettlementDetailLocationState = {
  successMessage?: string;
};

const statusActions: Record<string, { label: string; nextStatus: string }[]> = {
  draft: [
    { label: "Settle pembayaran", nextStatus: "settled" },
    { label: "Batalkan draft", nextStatus: "cancelled" },
  ],
};

export default function ConsignmentSettlementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [settlement, setSettlement] = useState<ConsignmentSettlementDto | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as SettlementDetailLocationState | null)?.successMessage ?? null,
  );

  async function loadSettlement() {
    if (!id) {
      setError("Settlement konsinyasi tidak valid.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setSettlement(await getConsignmentSettlementById(id));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat detail settlement konsinyasi."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSettlement();
  }, [id]);

  const availableActions = useMemo(
    () => (settlement ? statusActions[settlement.status] ?? [] : []),
    [settlement],
  );

  async function handleStatusConfirm() {
    if (!id || !pendingStatus) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateConsignmentSettlementStatus(id, { status: pendingStatus });
      setSettlement(result);
      setSuccessMessage(
        `Status settlement ${result.settlementNumber} berhasil diubah menjadi ${pendingStatus}.`,
      );
      setPendingStatus(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal mengubah status settlement konsinyasi."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Detail Settlement Konsinyasi"
      description="Tinjau hak supplier dari penjualan konsinyasi lalu proses settlement atau pembatalan draft."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      {isLoading ? (
        <AppLoader label="Memuat detail settlement..." />
      ) : !settlement ? null : (
        <div className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">No. settlement</p>
                  <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                    {settlement.settlementNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Supplier</p>
                  <p className="mt-2 text-base text-gray-700 dark:text-gray-200">
                    {settlement.supplierName}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Outlet</p>
                  <p className="mt-2 text-base text-gray-700 dark:text-gray-200">
                    {settlement.outletName}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Tanggal settlement</p>
                  <p className="mt-2 text-base text-gray-700 dark:text-gray-200">
                    {formatDateTime(settlement.settlementDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Jumlah sales</p>
                  <p className="mt-2 text-base text-gray-700 dark:text-gray-200">
                    {settlement.sales.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Total hak supplier</p>
                  <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(settlement.totalAmount)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getSettlementStatusClasses(
                      settlement.status,
                    )}`}
                  >
                    {settlement.status}
                  </span>
                  <AccountingPostingBadge
                    referenceType="consignment_settlement"
                    referenceId={settlement.id}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/consignment-settlements"
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                  >
                    Kembali ke settlement
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sales yang masuk settlement</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-950">
                  <tr>
                    {["Transaksi", "Produk", "Qty", "Unit Cost", "Total", "Status", "Tanggal"].map((column) => (
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
                  {settlement.sales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {sale.transactionNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                        {sale.productName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{sale.qty}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatCurrency(sale.unitCost)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{sale.status}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatDateTime(sale.createdAt)}
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
        title="Ubah status settlement konsinyasi"
        description={`Anda yakin ingin mengubah status settlement ini menjadi ${pendingStatus ?? ""}?`}
        confirmLabel="Proses status"
        isBusy={isSubmitting}
        onCancel={() => setPendingStatus(null)}
        onConfirm={() => void handleStatusConfirm()}
      />
    </ProtectedPageShell>
  );
}

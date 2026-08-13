import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import {
  getChannelSettlementById,
  updateChannelSettlementStatus,
} from "../api/channelsApi";
import type { ChannelSettlementDto } from "../types/channel";
import {
  formatCurrency,
  formatDateOnly,
  formatDateTime,
  getChannelSettlementStatusClasses,
} from "../utils/formatters";
import AccountingPostingBadge from "../../accounting-integrations/components/AccountingPostingBadge";

type LocationState = {
  successMessage?: string;
};

export default function ChannelSettlementDetailPage() {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<ChannelSettlementDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage] = useState<string | null>(
    (location.state as LocationState | null)?.successMessage ?? null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);

  async function loadDetail() {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      setDetail(await getChannelSettlementById(id));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat detail settlement channel."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDetail();
  }, [id]);

  async function handleStatus(status: "settled" | "cancelled") {
    if (!id) return;
    setIsBusy(true);
    setError(null);
    try {
      setDetail(await updateChannelSettlementStatus(id, { status }));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memperbarui status settlement channel."));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Detail Channel Settlement"
      description="Lihat transaksi yang termasuk settlement channel dan finalisasi status settled atau cancelled."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      {isLoading || !detail ? (
        <AppLoader label="Memuat detail settlement channel..." />
      ) : (
        <div className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">{detail.settlementNumber}</p>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{detail.channelAccountName}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{detail.channelName} • {detail.outletName}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {detail.status === "pending" ? (
                  <>
                    <Link
                      to={`/channel-settlements/${detail.id}/edit`}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                    >
                      Edit draft
                    </Link>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleStatus("settled")}
                      className="rounded-xl bg-success-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Settle
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleStatus("cancelled")}
                      className="rounded-xl bg-error-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Cancel
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Status</p>
                <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getChannelSettlementStatusClasses(detail.status)}`}>
                  {detail.status}
                </span>
                <div className="mt-3">
                  <AccountingPostingBadge
                    referenceType="channel_settlement"
                    referenceId={detail.id}
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Periode</p>
                <p className="mt-3 text-sm font-medium text-gray-900 dark:text-white">
                  {formatDateOnly(detail.periodStartDate)} - {formatDateOnly(detail.periodEndDate)}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Gross</p>
                <p className="mt-3 text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(detail.grossAmount)}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Komisi</p>
                <p className="mt-3 text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(detail.commissionAmount)}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Net</p>
                <p className="mt-3 text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(detail.netAmount)}</p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transaksi settlement</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-950">
                <tr>
                  {["Transaksi", "Tanggal", "Gross", "Komisi", "Net"].map((column) => (
                    <th
                      key={column}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {detail.items.map((item) => (
                  <tr key={item.transactionId}>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.transactionNumber}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{formatDateTime(item.transactionDate)}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(item.grossAmount)}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(item.commissionAmount)}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(item.netAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </ProtectedPageShell>
  );
}

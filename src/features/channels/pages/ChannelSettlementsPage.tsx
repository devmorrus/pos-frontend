import { useEffect, useState } from "react";
import { Link } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import ProcurementOutletSelector from "../../procurement/components/ProcurementOutletSelector";
import { useProcurementOutletScope } from "../../procurement/hooks/useProcurementOutletScope";
import { getErrorMessage } from "../../../utils/errors";
import { getChannelAccounts, getChannelSettlements } from "../api/channelsApi";
import type { ChannelAccountDto, ChannelSettlementListItemDto } from "../types/channel";
import {
  formatCurrency,
  formatDateTime,
  getChannelSettlementStatusClasses,
} from "../utils/formatters";

export default function ChannelSettlementsPage() {
  const { ownerMode, activeOutlets, effectiveOutletId, selectedOutletId, setSelectedOutletId } =
    useProcurementOutletScope();
  const [accounts, setAccounts] = useState<ChannelAccountDto[]>([]);
  const [settlements, setSettlements] = useState<ChannelSettlementListItemDto[]>([]);
  const [channelAccountId, setChannelAccountId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    if (!effectiveOutletId) {
      setAccounts([]);
      setSettlements([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [accountsResult, settlementsResult] = await Promise.all([
        getChannelAccounts(effectiveOutletId),
        getChannelSettlements({
          outletId: effectiveOutletId,
          channelAccountId: channelAccountId || undefined,
          status: statusFilter,
        }),
      ]);
      setAccounts(accountsResult);
      setSettlements(settlementsResult);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat settlement channel."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [effectiveOutletId, channelAccountId, statusFilter]);

  const shouldShowOutletPrompt = ownerMode && !effectiveOutletId;

  return (
    <ProtectedPageShell
      title="Channel Settlements"
      description="Rekonsiliasi penjualan channel marketplace menjadi settlement finansial yang final per outlet."
    >
      <InlineAlert tone="error" message={error} />

      <AppTableShell
        title="Daftar settlement channel"
        description={`${settlements.length} settlement`}
        actions={
          <>
            <ProcurementOutletSelector
              ownerMode={ownerMode}
              value={selectedOutletId}
              onChange={setSelectedOutletId}
              outlets={activeOutlets}
            />
            <select
              value={channelAccountId}
              onChange={(event) => setChannelAccountId(event.target.value)}
              className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            >
              <option value="">Semua account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            >
              <option value="all">Semua status</option>
              <option value="pending">Pending</option>
              <option value="settled">Settled</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Link
              to="/channel-settlements/create"
              className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Buat settlement
            </Link>
          </>
        }
      >
        {isLoading ? (
          <AppLoader label="Memuat settlement channel..." />
        ) : shouldShowOutletPrompt ? (
          <div className="p-6">
            <PagePlaceholder
              title="Pilih outlet terlebih dahulu"
              description="Owner perlu memilih outlet aktif sebelum melihat settlement channel."
              status="Outlet required"
            />
          </div>
        ) : settlements.length === 0 ? (
          <div className="p-6">
            <PagePlaceholder
              title="Belum ada settlement channel"
              description="Buat settlement baru dari transaksi channel yang eligible."
              status="Empty"
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                {["No. Settlement", "Tanggal", "Account", "Outlet", "Gross", "Komisi", "Net", "Status", "Aksi"].map((column) => (
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
              {settlements.map((settlement) => (
                <tr key={settlement.id}>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">{settlement.settlementNumber}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{formatDateTime(settlement.settlementDate)}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{settlement.channelAccountName}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{settlement.outletName}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(settlement.grossAmount)}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(settlement.commissionAmount)}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(settlement.netAmount)}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getChannelSettlementStatusClasses(settlement.status)}`}>
                      {settlement.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <Link
                        to={`/channel-settlements/${settlement.id}`}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                      >
                        Detail
                      </Link>
                      {settlement.status === "pending" ? (
                        <Link
                          to={`/channel-settlements/${settlement.id}/edit`}
                          className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                        >
                          Edit
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AppTableShell>
    </ProtectedPageShell>
  );
}

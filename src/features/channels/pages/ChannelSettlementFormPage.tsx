import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import ProcurementOutletSelector from "../../procurement/components/ProcurementOutletSelector";
import { useProcurementOutletScope } from "../../procurement/hooks/useProcurementOutletScope";
import { getErrorMessage } from "../../../utils/errors";
import {
  createChannelSettlement,
  getChannelAccounts,
  getChannelSettlementById,
  getEligibleChannelTransactions,
  updateChannelSettlement,
} from "../api/channelsApi";
import type {
  ChannelAccountDto,
  ChannelSettlementDto,
  ChannelSettlementEligibleTransactionDto,
} from "../types/channel";
import { formatCurrency, formatDateTime } from "../utils/formatters";

function toInputDate(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default function ChannelSettlementFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const { ownerMode, activeOutlets, effectiveOutletId, selectedOutletId, setSelectedOutletId } =
    useProcurementOutletScope();
  const [accounts, setAccounts] = useState<ChannelAccountDto[]>([]);
  const [eligibleTransactions, setEligibleTransactions] = useState<ChannelSettlementEligibleTransactionDto[]>([]);
  const [existing, setExisting] = useState<ChannelSettlementDto | null>(null);
  const [channelAccountId, setChannelAccountId] = useState("");
  const [periodStartDate, setPeriodStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [periodEndDate, setPeriodEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [commissionOverride, setCommissionOverride] = useState("");
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBase() {
      setIsLoading(true);
      setError(null);
      try {
        const outletId = isEditMode && existing ? existing.outletId : effectiveOutletId;
        if (outletId) {
          setAccounts(await getChannelAccounts(outletId));
        }

        if (isEditMode && id) {
          const detail = await getChannelSettlementById(id);
          setExisting(detail);
          setChannelAccountId(detail.channelAccountId);
          setPeriodStartDate(toInputDate(detail.periodStartDate));
          setPeriodEndDate(toInputDate(detail.periodEndDate));
          setCommissionOverride(String(detail.commissionAmount));
          setSelectedTransactionIds(detail.items.map((item) => item.transactionId));
          setAccounts(await getChannelAccounts(detail.outletId));
        }
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat form settlement channel."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadBase();
  }, [id, isEditMode, effectiveOutletId]);

  useEffect(() => {
    async function loadEligibleTransactions() {
      if (!channelAccountId || !periodStartDate || !periodEndDate) {
        setEligibleTransactions([]);
        return;
      }

      setIsLoadingTransactions(true);
      try {
        setEligibleTransactions(
          await getEligibleChannelTransactions({
            channelAccountId,
            periodStartDate,
            periodEndDate,
            excludeSettlementId: id,
          }),
        );
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat transaksi channel yang eligible."));
      } finally {
        setIsLoadingTransactions(false);
      }
    }

    void loadEligibleTransactions();
  }, [channelAccountId, periodStartDate, periodEndDate, id]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === channelAccountId) ?? null,
    [accounts, channelAccountId],
  );
  const shouldShowOutletPrompt = ownerMode && !effectiveOutletId && !isEditMode;

  const selectedTransactions = useMemo(
    () => eligibleTransactions.filter((transaction) => selectedTransactionIds.includes(transaction.transactionId)),
    [eligibleTransactions, selectedTransactionIds],
  );
  const grossAmount = useMemo(
    () => selectedTransactions.reduce((sum, transaction) => sum + transaction.grandTotal, 0),
    [selectedTransactions],
  );
  const commissionAmount = useMemo(() => {
    if (commissionOverride.trim()) {
      return Number(commissionOverride || 0);
    }
    const defaultRate = selectedAccount?.defaultCommissionRate ?? 0;
    return Math.round(grossAmount * (defaultRate / 100) * 100) / 100;
  }, [commissionOverride, grossAmount, selectedAccount?.defaultCommissionRate]);
  const netAmount = grossAmount - commissionAmount;

  function toggleTransaction(idToToggle: string) {
    setSelectedTransactionIds((current) =>
      current.includes(idToToggle)
        ? current.filter((idValue) => idValue !== idToToggle)
        : [...current, idToToggle],
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!channelAccountId || selectedTransactionIds.length === 0) {
      setError("Pilih account channel dan minimal satu transaksi.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        channelAccountId,
        periodStartDate,
        periodEndDate,
        commissionAmountOverride: commissionOverride.trim() ? Number(commissionOverride) : null,
        transactionIds: selectedTransactionIds,
      };

      if (isEditMode && id) {
        const result = await updateChannelSettlement(id, payload);
        navigate(`/channel-settlements/${result.id}`, {
          replace: true,
          state: { successMessage: `Settlement ${result.settlementNumber} berhasil diperbarui.` },
        });
      } else {
        const result = await createChannelSettlement(payload);
        navigate(`/channel-settlements/${result.id}`, {
          replace: true,
          state: { successMessage: `Settlement ${result.settlementNumber} berhasil dibuat.` },
        });
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal menyimpan settlement channel."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ProtectedPageShell
      title={isEditMode ? "Edit Channel Settlement" : "Buat Channel Settlement"}
      description="Pilih account channel, periode transaksi, lalu tentukan transaksi yang masuk ke settlement finansial."
    >
      <InlineAlert tone="error" message={error} />

      {isLoading ? (
        <AppLoader label="Memuat form settlement channel..." />
      ) : shouldShowOutletPrompt ? (
        <PagePlaceholder
          title="Pilih outlet terlebih dahulu"
          description="Owner perlu memilih outlet aktif sebelum membuat settlement channel."
          status="Outlet required"
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isEditMode ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
              <ProcurementOutletSelector
                ownerMode={ownerMode}
                value={selectedOutletId}
                onChange={setSelectedOutletId}
                outlets={activeOutlets}
              />
            </div>
          ) : null}

          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Konfigurasi settlement</h3>
                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Channel account</span>
                    <select
                      value={channelAccountId}
                      onChange={(event) => setChannelAccountId(event.target.value)}
                      className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                    >
                      <option value="">Pilih account</option>
                      {accounts.filter((account) => account.isActive || account.id === channelAccountId).map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} • {account.channelName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Tanggal mulai</span>
                      <input
                        type="date"
                        value={periodStartDate}
                        onChange={(event) => setPeriodStartDate(event.target.value)}
                        className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Tanggal akhir</span>
                      <input
                        type="date"
                        value={periodEndDate}
                        onChange={(event) => setPeriodEndDate(event.target.value)}
                        className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Override komisi (opsional)</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={commissionOverride}
                      onChange={(event) => setCommissionOverride(event.target.value)}
                      className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ringkasan finansial</h3>
                <dl className="mt-5 space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Gross</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{formatCurrency(grossAmount)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Komisi</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{formatCurrency(commissionAmount)}</dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-4 dark:border-gray-800">
                    <dt className="font-semibold text-gray-900 dark:text-white">Net</dt>
                    <dd className="font-semibold text-gray-900 dark:text-white">{formatCurrency(netAmount)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transaksi eligible</h3>
              </div>
              {isLoadingTransactions ? (
                <AppLoader label="Memuat transaksi eligible..." />
              ) : eligibleTransactions.length === 0 ? (
                <div className="p-6">
                  <PagePlaceholder
                    title="Belum ada transaksi eligible"
                    description="Pilih account dan periode untuk memuat transaksi channel yang belum pernah disettle."
                    status="Empty"
                  />
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-950">
                    <tr>
                      {["Pilih", "Transaksi", "Kasir", "Tanggal", "Total"].map((column) => (
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
                    {eligibleTransactions.map((transaction) => (
                      <tr key={transaction.transactionId}>
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedTransactionIds.includes(transaction.transactionId)}
                            onChange={() => toggleTransaction(transaction.transactionId)}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{transaction.transactionNumber}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{transaction.channel}</p>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{transaction.cashierName}</td>
                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{formatDateTime(transaction.createdAt)}</td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.grandTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <Link
              to={isEditMode && id ? `/channel-settlements/${id}` : "/channel-settlements"}
              className="inline-flex items-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
            >
              {isSaving ? "Menyimpan..." : isEditMode ? "Simpan perubahan" : "Simpan draft"}
            </button>
          </div>
        </form>
      )}
    </ProtectedPageShell>
  );
}

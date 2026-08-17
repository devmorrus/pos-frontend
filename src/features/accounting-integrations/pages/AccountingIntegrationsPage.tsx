import { useEffect, useMemo, useState } from "react";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { formatDateTime } from "../../transactions/utils/formatters";
import {
  getAccountingPostingStatus,
  runAccountingBackfill,
} from "../api/accountingIntegrationsApi";
import type {
  AccountingBackfillRequest,
  AccountingBackfillResultDto,
  AccountingPostingStatusDto,
  AccountingReferenceType,
} from "../types/accountingIntegration";
import { useOutlet } from "../../outlets/hooks/useOutlet";
import { getRecentTransactions } from "../../transactions/api/transactionsApi";
import { getPurchaseOrders } from "../../purchase-orders/api/purchaseOrdersApi";

type ReferenceOption = {
  value: AccountingReferenceType;
  label: string;
  description: string;
};

const referenceOptions: ReferenceOption[] = [
  { value: "transaction_sale", label: "Penjualan POS", description: "Checkout final dari transaksi kasir." },
  { value: "purchase_order", label: "Purchase Order", description: "PO completed non-konsinyasi." },
  { value: "supplier_payment", label: "Pembayaran Supplier", description: "Pembayaran utang supplier yang sudah paid." },
  { value: "supplier_return", label: "Retur Supplier", description: "Retur supplier yang sudah sent/completed." },
  { value: "channel_settlement", label: "Settlement Channel", description: "Settlement channel berstatus settled." },
  { value: "consignment_settlement", label: "Settlement Konsinyasi", description: "Settlement konsinyasi berstatus settled." },
];

const defaultBackfillState: AccountingBackfillRequest = {
  dateFrom: null,
  dateTo: null,
  includeTransactions: true,
  includePurchaseOrders: true,
  includeSupplierPayments: true,
  includeSupplierReturns: true,
  includeChannelSettlements: true,
  includeConsignmentSettlements: true,
};

export default function AccountingIntegrationsPage() {
  const { selectedOutletId } = useOutlet();

  const [referenceType, setReferenceType] = useState<AccountingReferenceType>("transaction_sale");
  const [referenceId, setReferenceId] = useState("");
  const [lookupResult, setLookupResult] = useState<AccountingPostingStatusDto | null>(null);
  const [backfillResult, setBackfillResult] = useState<AccountingBackfillResultDto | null>(null);
  const [backfillForm, setBackfillForm] = useState<AccountingBackfillRequest>(defaultBackfillState);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);

  // States for lookup helper
  const [recentTransactions, setRecentTransactions] = useState<{ id: string; num: string; date: string; amount: number }[]>([]);
  const [recentPOs, setRecentPOs] = useState<{ id: string; num: string; date: string; amount: number }[]>([]);
  const [isLoadingHelpers, setIsLoadingHelpers] = useState(false);

  useEffect(() => {
    async function loadHelpers() {
      if (!selectedOutletId) return;
      setIsLoadingHelpers(true);
      try {
        if (referenceType === "transaction_sale") {
          const list = await getRecentTransactions(selectedOutletId, 5);
          setRecentTransactions(list.map(t => ({
            id: t.id,
            num: t.transactionNumber,
            date: t.createdAt,
            amount: t.grandTotal
          })));
        } else if (referenceType === "purchase_order") {
          const list = await getPurchaseOrders({ outletId: selectedOutletId });
          setRecentPOs(list.slice(0, 5).map(po => ({
            id: po.id,
            num: po.poNumber,
            date: po.poDate,
            amount: po.totalAmount
          })));
        }
      } catch (err) {
        console.error("Failed to load helpers", err);
      } finally {
        setIsLoadingHelpers(false);
      }
    }
    void loadHelpers();
  }, [referenceType, selectedOutletId]);

  const selectedReference = useMemo(
    () => referenceOptions.find((option) => option.value === referenceType) ?? referenceOptions[0],
    [referenceType],
  );

  const backfillTotal = useMemo(() => {
    if (!backfillResult) return 0;
    return (
      backfillResult.transactionsPosted
      + backfillResult.purchaseOrdersPosted
      + backfillResult.supplierPaymentsPosted
      + backfillResult.supplierReturnsPosted
      + backfillResult.channelSettlementsPosted
      + backfillResult.consignmentSettlementsPosted
    );
  }, [backfillResult]);

  async function handleLookup() {
    if (!referenceId.trim()) {
      setError("Reference ID wajib diisi.");
      return;
    }

    setIsChecking(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await getAccountingPostingStatus(referenceType, referenceId.trim());
      setLookupResult(result);
      setSuccessMessage("Status integrasi akuntansi berhasil dimuat.");
    } catch (requestError) {
      setLookupResult(null);
      setError(getErrorMessage(requestError, "Gagal memeriksa status integrasi akuntansi."));
    } finally {
      setIsChecking(false);
    }
  }

  async function handleBackfill() {
    setIsBackfilling(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await runAccountingBackfill(backfillForm);
      setBackfillResult(result);
      setSuccessMessage("Backfill integrasi akuntansi berhasil dijalankan.");
    } catch (requestError) {
      setBackfillResult(null);
      setError(getErrorMessage(requestError, "Gagal menjalankan backfill integrasi akuntansi."));
    } finally {
      setIsBackfilling(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Accounting Integrations"
      description="Pantau status jurnal otomatis dari modul existing dan jalankan backfill agar laporan akuntansi tetap sinkron."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      <div className="space-y-6">
        <section className="grid gap-4 xl:grid-cols-3">
          {referenceOptions.map((item) => (
            <article
              key={item.value}
              className={`rounded-3xl border p-5 shadow-theme-sm transition ${
                item.value === referenceType
                  ? "border-brand-200 bg-brand-50/60 dark:border-brand-500/40 dark:bg-brand-500/10"
                  : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">{item.label}</p>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cek status posting</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Gunakan reference type dan ID transaksi source untuk memastikan jurnal phase 7 sudah terbentuk.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm text-gray-700 dark:text-gray-200">
                <span className="font-medium">Reference Type</span>
                <select
                  value={referenceType}
                  onChange={(event) => setReferenceType(event.target.value as AccountingReferenceType)}
                  className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                >
                  {referenceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-gray-700 dark:text-gray-200">
                <span className="font-medium">Reference ID / Nomor Dokumen</span>
                <input
                  type="text"
                  value={referenceId}
                  onChange={(event) => setReferenceId(event.target.value)}
                  placeholder="Masukkan Nomor Invoice, Nomor PO, atau GUID"
                  className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
              </label>

              {/* Helper list for selecting recent IDs */}
              {(referenceType === "transaction_sale" || referenceType === "purchase_order") && (
                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800/60 dark:bg-gray-900/50">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Pilih dari Transaksi / PO Terakhir</span>
                    {isLoadingHelpers && <span className="text-[10px] text-brand-500 lowercase normal-case">Memuat...</span>}
                  </h4>
                  {referenceType === "transaction_sale" && recentTransactions.length > 0 && (
                    <div className="space-y-2">
                      {recentTransactions.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs border-b border-gray-100/60 pb-1.5 last:border-0 last:pb-0 dark:border-gray-800">
                          <div className="truncate pr-2">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{item.num}</span>
                            <span className="text-gray-400 mx-1.5">·</span>
                            <span className="text-gray-500">{new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReferenceId(item.num)}
                            className="text-brand-600 dark:text-brand-400 font-bold px-2 py-0.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/30 flex-shrink-0"
                          >
                            Pilih
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {referenceType === "purchase_order" && recentPOs.length > 0 && (
                    <div className="space-y-2">
                      {recentPOs.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs border-b border-gray-100/60 pb-1.5 last:border-0 last:pb-0 dark:border-gray-800">
                          <div className="truncate pr-2">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{item.num}</span>
                            <span className="text-gray-400 mx-1.5">·</span>
                            <span className="text-gray-500">{new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReferenceId(item.num)}
                            className="text-brand-600 dark:text-brand-400 font-bold px-2 py-0.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/30 flex-shrink-0"
                          >
                            Pilih
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {((referenceType === "transaction_sale" && recentTransactions.length === 0) || 
                    (referenceType === "purchase_order" && recentPOs.length === 0)) && !isLoadingHelpers && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">Tidak ada data terbaru.</p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleLookup()}
                  disabled={isChecking}
                  className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isChecking ? "Memeriksa..." : "Cek status"}
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400">{selectedReference.description}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hasil pemeriksaan</h3>
            {lookupResult ? (
              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      lookupResult.isPosted
                        ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300"
                        : "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300"
                    }`}
                  >
                    {lookupResult.isPosted ? "Sudah terjurnal" : "Belum terjurnal"}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {lookupResult.referenceType} • {lookupResult.referenceId}
                  </span>
                </div>
                <dl className="grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                    <dt className="text-gray-500 dark:text-gray-400">Jumlah line jurnal</dt>
                    <dd className="mt-2 font-semibold text-gray-900 dark:text-white">{lookupResult.entryCount}</dd>
                  </div>
                  <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                    <dt className="text-gray-500 dark:text-gray-400">No. transaksi jurnal</dt>
                    <dd className="mt-2 font-semibold text-gray-900 dark:text-white">{lookupResult.trxNumber ?? "-"}</dd>
                  </div>
                  <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800 md:col-span-2">
                    <dt className="text-gray-500 dark:text-gray-400">Tanggal posting</dt>
                    <dd className="mt-2 font-semibold text-gray-900 dark:text-white">
                      {lookupResult.trxDate ? formatDateTime(lookupResult.trxDate) : "-"}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-gray-300 p-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Belum ada hasil. Pilih reference type lalu masukkan ID transaksi source untuk memeriksa status posting jurnal.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Backfill integrasi</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Gunakan saat ada transaksi final lama yang belum sempat diposting ke jurnal accounting phase 7.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleBackfill()}
              disabled={isBackfilling}
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isBackfilling ? "Menjalankan backfill..." : "Jalankan backfill"}
            </button>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-gray-700 dark:text-gray-200">
                <span className="font-medium">Tanggal mulai</span>
                <input
                  type="date"
                  value={backfillForm.dateFrom ?? ""}
                  onChange={(event) => setBackfillForm((current) => ({ ...current, dateFrom: event.target.value || null }))}
                  className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
              </label>
              <label className="grid gap-2 text-sm text-gray-700 dark:text-gray-200">
                <span className="font-medium">Tanggal akhir</span>
                <input
                  type="date"
                  value={backfillForm.dateTo ?? ""}
                  onChange={(event) => setBackfillForm((current) => ({ ...current, dateTo: event.target.value || null }))}
                  className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={backfillForm.includeTransactions}
                  onChange={(event) => setBackfillForm((current) => ({ ...current, includeTransactions: event.target.checked }))}
                />
                Penjualan POS
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={backfillForm.includePurchaseOrders}
                  onChange={(event) => setBackfillForm((current) => ({ ...current, includePurchaseOrders: event.target.checked }))}
                />
                Purchase Order
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={backfillForm.includeSupplierPayments}
                  onChange={(event) => setBackfillForm((current) => ({ ...current, includeSupplierPayments: event.target.checked }))}
                />
                Pembayaran Supplier
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={backfillForm.includeSupplierReturns}
                  onChange={(event) => setBackfillForm((current) => ({ ...current, includeSupplierReturns: event.target.checked }))}
                />
                Retur Supplier
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={backfillForm.includeChannelSettlements}
                  onChange={(event) => setBackfillForm((current) => ({ ...current, includeChannelSettlements: event.target.checked }))}
                />
                Settlement Channel
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-gray-200 p-4 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={backfillForm.includeConsignmentSettlements}
                  onChange={(event) => setBackfillForm((current) => ({ ...current, includeConsignmentSettlements: event.target.checked }))}
                />
                Settlement Konsinyasi
              </label>
            </div>

            <div className="rounded-2xl border border-dashed border-gray-300 p-5 dark:border-gray-700">
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Ringkasan hasil terakhir</h4>
              {backfillResult ? (
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Total source terposting</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{backfillTotal}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Penjualan POS</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{backfillResult.transactionsPosted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Purchase Order</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{backfillResult.purchaseOrdersPosted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Pembayaran Supplier</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{backfillResult.supplierPaymentsPosted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Retur Supplier</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{backfillResult.supplierReturnsPosted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Settlement Channel</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{backfillResult.channelSettlementsPosted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Settlement Konsinyasi</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{backfillResult.consignmentSettlementsPosted}</span>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Belum ada eksekusi backfill pada sesi ini.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </ProtectedPageShell>
  );
}

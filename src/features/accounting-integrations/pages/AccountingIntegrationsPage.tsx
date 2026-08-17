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
  icon: string;
  color: string;
};

const referenceOptions: ReferenceOption[] = [
  { value: "transaction_sale",       label: "Penjualan POS",        description: "Checkout final dari transaksi kasir.", icon: "🛒", color: "from-violet-500 to-purple-600" },
  { value: "purchase_order",         label: "Purchase Order",        description: "PO completed non-konsinyasi.",        icon: "📦", color: "from-blue-500 to-cyan-600" },
  { value: "supplier_payment",       label: "Pembayaran Supplier",   description: "Pembayaran utang supplier paid.",     icon: "💳", color: "from-emerald-500 to-teal-600" },
  { value: "supplier_return",        label: "Retur Supplier",        description: "Retur supplier sent/completed.",     icon: "↩️", color: "from-orange-500 to-amber-600" },
  { value: "channel_settlement",     label: "Settlement Channel",    description: "Settlement channel berstatus settled.", icon: "📡", color: "from-pink-500 to-rose-600" },
  { value: "consignment_settlement", label: "Settlement Konsinyasi", description: "Settlement konsinyasi settled.",     icon: "🤝", color: "from-indigo-500 to-blue-600" },
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

const backfillModules = [
  { key: "includeTransactions",          label: "Penjualan POS",        icon: "🛒" },
  { key: "includePurchaseOrders",        label: "Purchase Order",        icon: "📦" },
  { key: "includeSupplierPayments",      label: "Pembayaran Supplier",   icon: "💳" },
  { key: "includeSupplierReturns",       label: "Retur Supplier",        icon: "↩️" },
  { key: "includeChannelSettlements",    label: "Settlement Channel",    icon: "📡" },
  { key: "includeConsignmentSettlements",label: "Settlement Konsinyasi", icon: "🤝" },
] as const;

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
          setRecentTransactions(list.map(t => ({ id: t.id, num: t.transactionNumber, date: t.createdAt, amount: t.grandTotal })));
        } else if (referenceType === "purchase_order") {
          const list = await getPurchaseOrders({ outletId: selectedOutletId });
          setRecentPOs(list.slice(0, 5).map(po => ({ id: po.id, num: po.poNumber, date: po.poDate, amount: po.totalAmount })));
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
    () => referenceOptions.find(o => o.value === referenceType) ?? referenceOptions[0],
    [referenceType],
  );

  const backfillTotal = useMemo(() => {
    if (!backfillResult) return 0;
    return (
      backfillResult.transactionsPosted + backfillResult.purchaseOrdersPosted +
      backfillResult.supplierPaymentsPosted + backfillResult.supplierReturnsPosted +
      backfillResult.channelSettlementsPosted + backfillResult.consignmentSettlementsPosted
    );
  }, [backfillResult]);

  async function handleLookup() {
    if (!referenceId.trim()) { setError("Reference ID wajib diisi."); return; }
    setIsChecking(true); setError(null); setSuccessMessage(null);
    try {
      const result = await getAccountingPostingStatus(referenceType, referenceId.trim());
      setLookupResult(result);
      setSuccessMessage("Status integrasi akuntansi berhasil dimuat.");
    } catch (requestError) {
      setLookupResult(null);
      setError(getErrorMessage(requestError, "Gagal memeriksa status integrasi akuntansi."));
    } finally { setIsChecking(false); }
  }

  async function handleBackfill() {
    setIsBackfilling(true); setError(null); setSuccessMessage(null);
    try {
      const result = await runAccountingBackfill(backfillForm);
      setBackfillResult(result);
      setSuccessMessage("Backfill integrasi akuntansi berhasil dijalankan.");
    } catch (requestError) {
      setBackfillResult(null);
      setError(getErrorMessage(requestError, "Gagal menjalankan backfill integrasi akuntansi."));
    } finally { setIsBackfilling(false); }
  }

  const quickList = referenceType === "transaction_sale" ? recentTransactions : referenceType === "purchase_order" ? recentPOs : [];
  const showQuickList = referenceType === "transaction_sale" || referenceType === "purchase_order";

  return (
    <ProtectedPageShell
      title="Accounting Integrations"
      description="Pantau status jurnal otomatis dari modul existing dan jalankan backfill agar laporan akuntansi tetap sinkron."
    >
      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse-ring { 0%,100% { opacity:.4; transform:scale(1); } 50% { opacity:.8; transform:scale(1.08); } }
        @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
        .ai-card { animation: fadeInUp .35s ease both; }
        .ai-card:nth-child(1){animation-delay:.05s} .ai-card:nth-child(2){animation-delay:.1s}
        .ai-card:nth-child(3){animation-delay:.15s} .ai-card:nth-child(4){animation-delay:.2s}
        .ai-card:nth-child(5){animation-delay:.25s} .ai-card:nth-child(6){animation-delay:.3s}
        .pulse-dot { animation: pulse-ring 2s ease-in-out infinite; }
        .shimmer-btn {
          background: linear-gradient(90deg, #7c3aed 0%, #9333ea 40%, #a855f7 60%, #7c3aed 100%);
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }
        .glass {
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .glass-dark {
          background: rgba(17,24,39,0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
      `}</style>

      <div className="space-y-8">
        <InlineAlert tone="success" message={successMessage} />
        <InlineAlert tone="error" message={error} />

        {/* ── Hero header banner ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 shadow-2xl">
          <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-white/5 pulse-dot" />
          <div className="absolute -bottom-8 right-20 h-40 w-40 rounded-full bg-white/5 pulse-dot" style={{animationDelay:".8s"}} />
          <div className="relative z-10">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sistem Akuntansi Otomatis
            </div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Integrasi Akuntansi</h2>
            <p className="mt-2 max-w-lg text-sm text-white/75">
              Pantau status penjurnalan otomatis seluruh modul operasional dan jalankan backfill agar buku besar selalu sinkron.
            </p>
          </div>
        </div>

        {/* ── Module type selector chips ── */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Pilih Modul Referensi</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {referenceOptions.map((item) => {
              const isActive = item.value === referenceType;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => { setReferenceType(item.value); setLookupResult(null); setReferenceId(""); }}
                  className={`ai-card group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg focus:outline-none ${
                    isActive
                      ? "border-transparent shadow-lg ring-2 ring-violet-500/40"
                      : "border-gray-200 bg-white hover:border-violet-200 dark:border-gray-800 dark:bg-gray-900/60"
                  }`}
                >
                  {isActive && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-10`} />
                  )}
                  <div className="relative">
                    <span className="text-2xl">{item.icon}</span>
                    <p className={`mt-2 text-xs font-bold leading-tight ${isActive ? "text-violet-700 dark:text-violet-300" : "text-gray-700 dark:text-gray-200"}`}>
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-tight text-gray-400 dark:text-gray-500 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                  {isActive && (
                    <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500">
                      <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Status Check + Results ── */}
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">

          {/* Left: input form */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-xl shadow-md">
                🔍
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Cek Status Posting</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Verifikasi jurnal akuntansi dari transaksi operasional</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Reference type select */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Tipe Referensi
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg">{selectedReference.icon}</span>
                  <select
                    value={referenceType}
                    onChange={(e) => setReferenceType(e.target.value as AccountingReferenceType)}
                    className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm font-medium text-gray-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    {referenceOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.icon} {o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reference ID input */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Nomor Dokumen / Reference ID
                </label>
                <input
                  type="text"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleLookup()}
                  placeholder="Masukkan Nomor Invoice, Nomor PO, atau GUID…"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Quick pick list */}
              {showQuickList && (
                <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4 dark:border-violet-900/30 dark:bg-violet-950/20">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                      {referenceType === "transaction_sale" ? "Transaksi" : "Purchase Order"} Terakhir
                    </span>
                    {isLoadingHelpers && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-violet-500">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
                        Memuat…
                      </span>
                    )}
                  </div>
                  {quickList.length > 0 ? (
                    <div className="space-y-1.5">
                      {quickList.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-xl border border-violet-100/60 bg-white px-3 py-2 dark:border-violet-900/20 dark:bg-gray-900/60"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">{item.num}</p>
                            <p className="text-[10px] text-gray-400">
                              {new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReferenceId(item.num)}
                            className="ml-3 flex-shrink-0 rounded-lg bg-violet-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm transition hover:bg-violet-600 active:scale-95"
                          >
                            Pilih
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : !isLoadingHelpers ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500">Tidak ada data terbaru untuk outlet ini.</p>
                  ) : null}
                </div>
              )}

              {/* CTA button */}
              <button
                type="button"
                onClick={() => void handleLookup()}
                disabled={isChecking}
                className="shimmer-btn flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition hover:opacity-90 disabled:opacity-60"
              >
                {isChecking ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Memeriksa…
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Cek Status Jurnal
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: result panel */}
          <div className={`rounded-3xl border p-6 shadow-sm transition-all duration-500 ${
            lookupResult
              ? lookupResult.isPosted
                ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-800/40 dark:bg-emerald-950/20"
                : "border-amber-200 bg-amber-50/40 dark:border-amber-800/40 dark:bg-amber-950/20"
              : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
          }`}>
            <div className="mb-5 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-xl shadow-md ${
                lookupResult
                  ? lookupResult.isPosted
                    ? "bg-gradient-to-br from-emerald-400 to-teal-500"
                    : "bg-gradient-to-br from-amber-400 to-orange-500"
                  : "bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700"
              }`}>
                {lookupResult ? (lookupResult.isPosted ? "✅" : "⚠️") : "📋"}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Hasil Pemeriksaan</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Detail status penjurnalan</p>
              </div>
            </div>

            {lookupResult ? (
              <div className="space-y-4">
                {/* Status badge */}
                <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold ${
                  lookupResult.isPosted
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${lookupResult.isPosted ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                  {lookupResult.isPosted ? "Sudah Terjurnal" : "Belum Terjurnal"}
                </div>

                <p className="break-all text-[10px] font-mono text-gray-400 dark:text-gray-500">
                  {lookupResult.referenceType} · {lookupResult.referenceId}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-700/60 dark:bg-gray-900/60">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">Line Jurnal</p>
                    <p className="mt-1.5 text-2xl font-bold text-gray-900 dark:text-white">{lookupResult.entryCount}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-700/60 dark:bg-gray-900/60">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400">No. Jurnal</p>
                    <p className="mt-1.5 text-sm font-bold text-gray-900 dark:text-white truncate">{lookupResult.trxNumber ?? "—"}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-700/60 dark:bg-gray-900/60">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">Tanggal Posting</p>
                  <p className="mt-1.5 text-sm font-bold text-gray-900 dark:text-white">
                    {lookupResult.trxDate ? formatDateTime(lookupResult.trxDate) : "—"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-10 dark:border-gray-700">
                <span className="text-4xl opacity-40">🔎</span>
                <p className="mt-3 text-center text-sm text-gray-400 dark:text-gray-500">
                  Belum ada hasil pemeriksaan.<br />Pilih modul &amp; masukkan nomor dokumen.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Backfill section ── */}
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/60 px-6 py-5 dark:border-gray-800 dark:bg-gray-900/60">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 text-xl shadow-md">
                ⚡
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Backfill Integrasi</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Posting ulang transaksi lama yang belum sempat terjurnal</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleBackfill()}
              disabled={isBackfilling}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-600 hover:to-rose-600 disabled:opacity-60"
            >
              {isBackfilling ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Menjalankan…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Jalankan Backfill
                </>
              )}
            </button>
          </div>

          <div className="grid gap-6 p-6 xl:grid-cols-[1.1fr_0.9fr]">
            {/* Date + module checkboxes */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={backfillForm.dateFrom ?? ""}
                    onChange={(e) => setBackfillForm(c => ({ ...c, dateFrom: e.target.value || null }))}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tanggal Akhir</label>
                  <input
                    type="date"
                    value={backfillForm.dateTo ?? ""}
                    onChange={(e) => setBackfillForm(c => ({ ...c, dateTo: e.target.value || null }))}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Sertakan Modul</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {backfillModules.map((mod) => {
                    const checked = backfillForm[mod.key as keyof AccountingBackfillRequest] as boolean;
                    return (
                      <label
                        key={mod.key}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-xs font-medium transition ${
                          checked
                            ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800/40 dark:bg-orange-950/20 dark:text-orange-300"
                            : "border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setBackfillForm(c => ({ ...c, [mod.key]: e.target.checked }))}
                          className="accent-orange-500"
                        />
                        <span>{mod.icon}</span>
                        <span className="leading-tight">{mod.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Result summary */}
            <div className={`rounded-2xl border p-5 transition-all duration-500 ${
              backfillResult
                ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:border-emerald-800/40 dark:from-emerald-950/20 dark:to-teal-950/20"
                : "border-dashed border-gray-200 bg-gray-50/60 dark:border-gray-700 dark:bg-gray-800/40"
            }`}>
              {backfillResult ? (
                <>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-lg shadow">✅</div>
                    <div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Backfill Selesai</p>
                      <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{backfillTotal} <span className="text-sm font-normal">data terposting</span></p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Penjualan POS",       val: backfillResult.transactionsPosted,          icon: "🛒" },
                      { label: "Purchase Order",       val: backfillResult.purchaseOrdersPosted,        icon: "📦" },
                      { label: "Pembayaran Supplier",  val: backfillResult.supplierPaymentsPosted,      icon: "💳" },
                      { label: "Retur Supplier",       val: backfillResult.supplierReturnsPosted,       icon: "↩️" },
                      { label: "Settlement Channel",   val: backfillResult.channelSettlementsPosted,    icon: "📡" },
                      { label: "Settlement Konsinyasi",val: backfillResult.consignmentSettlementsPosted,icon: "🤝" },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                          <span>{row.icon}</span>{row.label}
                        </span>
                        <span className={`font-bold ${row.val > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`}>
                          {row.val}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="text-3xl opacity-40">📊</span>
                  <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                    Ringkasan hasil backfill akan muncul<br />setelah eksekusi dijalankan.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedPageShell>
  );
}

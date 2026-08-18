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
import { getSupplierPayments } from "../../debts/api/debtsApi";
import { getSupplierReturns } from "../../supplier-returns/api/supplierReturnsApi";
import { getChannelSettlements } from "../../channels/api/channelsApi";
import { getConsignmentSettlements } from "../../consignments/api/consignmentsApi";

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

interface RecentItem {
  id: string;
  num: string;
  date: string;
  amount: number;
}

export default function AccountingIntegrationsPage() {
  const { selectedOutletId } = useOutlet();

  const [referenceType, setReferenceType] = useState<AccountingReferenceType>("transaction_sale");
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [lookupResult, setLookupResult] = useState<AccountingPostingStatusDto | null>(null);
  const [backfillResult, setBackfillResult] = useState<AccountingBackfillResultDto | null>(null);
  const [backfillForm, setBackfillForm] = useState<AccountingBackfillRequest>(defaultBackfillState);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  async function fetchItemPostingStatus(itemId: string, refType: AccountingReferenceType) {
    if (!itemId) return;
    setIsChecking(true);
    setError(null);
    try {
      const result = await getAccountingPostingStatus(refType, itemId);
      setLookupResult(result);
    } catch (requestError) {
      setLookupResult(null);
      setError(getErrorMessage(requestError, "Gagal memeriksa status integrasi akuntansi."));
    } finally {
      setIsChecking(false);
    }
  }

  useEffect(() => {
    async function loadRecentItems() {
      if (!selectedOutletId) return;
      setIsLoadingItems(true);
      setRecentItems([]);
      setSelectedItemId("");
      setLookupResult(null);
      setError(null);
      try {
        let items: RecentItem[] = [];
        if (referenceType === "transaction_sale") {
          const list = await getRecentTransactions(selectedOutletId, 10);
          items = list.map(t => ({
            id: t.id,
            num: t.transactionNumber,
            date: t.createdAt,
            amount: t.grandTotal
          }));
        } else if (referenceType === "purchase_order") {
          const list = await getPurchaseOrders({ outletId: selectedOutletId });
          items = list.slice(0, 10).map(po => ({
            id: po.id,
            num: po.poNumber,
            date: po.poDate,
            amount: po.totalAmount
          }));
        } else if (referenceType === "supplier_payment") {
          const list = await getSupplierPayments({ outletId: selectedOutletId });
          items = list.slice(0, 10).map(p => ({
            id: p.id,
            num: p.referenceNumber || `Pay #${p.poNumber}`,
            date: p.paymentDate,
            amount: p.amount
          }));
        } else if (referenceType === "supplier_return") {
          const list = await getSupplierReturns({ outletId: selectedOutletId });
          items = list.slice(0, 10).map(r => ({
            id: r.id,
            num: r.returnNumber,
            date: r.returnDate,
            amount: r.totalAmount
          }));
        } else if (referenceType === "channel_settlement") {
          const list = await getChannelSettlements({ outletId: selectedOutletId });
          items = list.slice(0, 10).map(s => ({
            id: s.id,
            num: s.settlementNumber,
            date: s.settlementDate,
            amount: s.netAmount
          }));
        } else if (referenceType === "consignment_settlement") {
          const list = await getConsignmentSettlements(selectedOutletId);
          items = list.slice(0, 10).map(s => ({
            id: s.id,
            num: s.settlementNumber,
            date: s.settlementDate,
            amount: s.totalAmount
          }));
        }

        setRecentItems(items);

        // Auto select the first item if available
        if (items.length > 0) {
          const firstItem = items[0];
          setSelectedItemId(firstItem.id);
          void fetchItemPostingStatus(firstItem.id, referenceType);
        }
      } catch (err) {
        console.error("Failed to load recent items", err);
        setError("Gagal memuat daftar dokumen terbaru.");
      } finally {
        setIsLoadingItems(false);
      }
    }
    void loadRecentItems();
  }, [referenceType, selectedOutletId]);

  const backfillTotal = useMemo(() => {
    if (!backfillResult) return 0;
    return (
      backfillResult.transactionsPosted + backfillResult.purchaseOrdersPosted +
      backfillResult.supplierPaymentsPosted + backfillResult.supplierReturnsPosted +
      backfillResult.channelSettlementsPosted + backfillResult.consignmentSettlementsPosted
    );
  }, [backfillResult]);

  const handleItemClick = (item: RecentItem) => {
    setSelectedItemId(item.id);
    void fetchItemPostingStatus(item.id, referenceType);
  };

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
                  onClick={() => { setReferenceType(item.value); setLookupResult(null); }}
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

          {/* Left: list of recent documents */}
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-xl shadow-md">
                📋
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Daftar Dokumen Terakhir</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pilih dokumen untuk melihat status penjurnalan otomatis</p>
              </div>
            </div>

            {isLoadingItems ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <svg className="h-8 w-8 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="mt-3 text-xs">Memuat dokumen terbaru...</p>
              </div>
            ) : recentItems.length > 0 ? (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {recentItems.map((item) => {
                  const isActive = selectedItemId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={`w-full flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-2xl border p-4 text-left transition-all duration-200 focus:outline-none hover:scale-[1.01] ${
                        isActive
                          ? "border-violet-500 bg-violet-50/30 ring-2 ring-violet-500/10 dark:bg-violet-950/10"
                          : "border-gray-200 bg-white hover:border-violet-200 dark:border-gray-800 dark:bg-gray-900/60"
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className={`text-sm font-semibold truncate ${isActive ? "text-violet-700 dark:text-violet-300" : "text-gray-900 dark:text-white"}`}>
                          {item.num}
                        </p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          {new Date(item.date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-0 flex-shrink-0">
                        <span className={`text-xs font-bold ${isActive ? "text-violet-600 dark:text-violet-400" : "text-gray-600 dark:text-gray-300"}`}>
                          Rp {item.amount.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-12 dark:border-gray-700">
                <span className="text-4xl opacity-40">📭</span>
                <p className="mt-3 text-center text-sm text-gray-400 dark:text-gray-500">
                  Tidak ada dokumen terbaru untuk modul ini.
                </p>
              </div>
            )}
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

            {isChecking ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <svg className="h-8 w-8 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="mt-3 text-xs">Memeriksa status jurnal...</p>
              </div>
            ) : lookupResult ? (
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
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 dark:border-gray-700">
                <span className="text-4xl opacity-40">🔎</span>
                <p className="mt-3 text-center text-sm text-gray-400 dark:text-gray-500">
                  {isLoadingItems
                    ? "Memuat data..."
                    : "Pilih salah satu dokumen di sebelah kiri untuk melihat detail status jurnal."}
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
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      value={backfillForm.dateFrom ?? ""}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      onChange={(e) => setBackfillForm(c => ({ ...c, dateFrom: e.target.value || null }))}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-3 pr-10 text-sm text-gray-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                    <div className="absolute right-3 flex items-center pointer-events-none text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tanggal Akhir</label>
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      value={backfillForm.dateTo ?? ""}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      onChange={(e) => setBackfillForm(c => ({ ...c, dateTo: e.target.value || null }))}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-3 pr-10 text-sm text-gray-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                    <div className="absolute right-3 flex items-center pointer-events-none text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                        />
                      </svg>
                    </div>
                  </div>
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

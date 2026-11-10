import { formatCashFlowCurrency } from "../utils/presentation";
import { DocsIcon, DollarLineIcon, ListIcon } from "../../../icons";

type CashFlowStatusSummaryProps = {
  totalTransactions: number;
  totalAmount: number;
  totalDocuments: number;
};

export default function CashFlowStatusSummary({
  totalTransactions,
  totalAmount,
  totalDocuments,
}: CashFlowStatusSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"><ListIcon className="h-6 w-6" aria-hidden="true" /></div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total transaksi</p>
        <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{totalTransactions}</p>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Sesuai filter yang dipilih</p>
      </div>
      <div className="min-w-0 rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5 shadow-theme-sm dark:border-[#293b58] dark:from-[#172554] dark:to-[#111b2c]">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white"><DollarLineIcon className="h-6 w-6" aria-hidden="true" /></div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">Total nominal</p>
        <p className="mt-3 break-words text-2xl font-bold text-brand-700 dark:text-brand-200">{formatCashFlowCurrency(totalAmount)}</p>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Akumulasi transaksi pada hasil filter</p>
      </div>
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300"><DocsIcon className="h-6 w-6" aria-hidden="true" /></div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Dengan lampiran</p>
        <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{totalDocuments}</p>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Transaksi yang memiliki bukti pendukung</p>
      </div>
    </div>
  );
}

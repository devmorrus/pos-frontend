import { formatCashFlowCurrency } from "../utils/presentation";

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
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Total transaksi</p>
        <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{totalTransactions}</p>
      </div>
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Total nominal</p>
        <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{formatCashFlowCurrency(totalAmount)}</p>
      </div>
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Jumlah dokumen</p>
        <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{totalDocuments}</p>
      </div>
    </div>
  );
}

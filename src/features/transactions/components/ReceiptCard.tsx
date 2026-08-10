import type { TransactionDto } from "../types/transaction";
import {
  formatCurrency,
  formatDateTime,
  formatPaymentMethod,
} from "../utils/formatters";
import TransactionStatusBadge from "./TransactionStatusBadge";

type ReceiptCardProps = {
  transaction: TransactionDto;
};

export default function ReceiptCard({ transaction }: ReceiptCardProps) {
  return (
    <section className="receipt-print-root rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-dashed border-gray-200 pb-4 dark:border-gray-800">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">
            MorrusPOS
          </p>
          <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
            Struk Transaksi
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {transaction.outletName}
          </p>
        </div>
        <div className="text-right">
          <TransactionStatusBadge status={transaction.status} />
          <p className="mt-3 text-sm font-medium text-gray-900 dark:text-white">
            {transaction.transactionNumber}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formatDateTime(transaction.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-gray-600 dark:text-gray-300 md:grid-cols-2">
        <p>Kasir: <span className="font-medium text-gray-900 dark:text-white">{transaction.userName}</span></p>
        <p>Channel: <span className="font-medium text-gray-900 dark:text-white">{transaction.channel}</span></p>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-950">
            <tr>
              {["Produk", "Qty", "Harga", "Diskon", "Total"].map((column) => (
                <th
                  key={column}
                  className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {transaction.items.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-3 text-sm">
                  <p className="font-medium text-gray-900 dark:text-white">{item.productName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.sku}</p>
                </td>
                <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300">{item.qty}</td>
                <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(item.unitPrice)}</td>
                <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(item.discountAmount)}</td>
                <td className="px-3 py-3 text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            Pembayaran
          </h4>
          <div className="mt-3 space-y-2">
            {transaction.payments.map((payment, index) => (
              <div key={`${payment.method}-${index}`} className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 text-sm dark:bg-gray-950">
                <span className="text-gray-600 dark:text-gray-300">
                  {formatPaymentMethod(payment.method)}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(payment.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            Ringkasan
          </h4>
          <dl className="mt-3 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Subtotal</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Diskon manual</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.manualDiscountTotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Promo</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.promoDiscountTotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Voucher</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.voucherDiscountTotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Service charge</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.serviceChargeTotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-gray-500 dark:text-gray-400">Pajak</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.taxTotal)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-3 dark:border-gray-800">
              <dt className="text-base font-semibold text-gray-900 dark:text-white">Grand Total</dt>
              <dd className="text-base font-semibold text-gray-900 dark:text-white">{formatCurrency(transaction.grandTotal)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

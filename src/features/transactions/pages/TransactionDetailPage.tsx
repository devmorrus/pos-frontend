import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppErrorState, AppLoader, InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { getTransactionById } from "../api/transactionsApi";
import type { TransactionDto } from "../types/transaction";
import {
  formatCurrency,
  formatDateTime,
  formatPaymentMethod,
} from "../utils/formatters";
import TransactionActionPanel from "../components/TransactionActionPanel";
import ReceiptCard from "../components/ReceiptCard";
import TransactionStatusBadge from "../components/TransactionStatusBadge";

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [transaction, setTransaction] = useState<TransactionDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetail() {
      if (!id) {
        setError("ID transaksi tidak valid.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        setTransaction(await getTransactionById(id));
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat detail transaksi."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadDetail();
  }, [id]);

  return (
    <ProtectedPageShell
      title="Detail Transaksi"
      description="Rincian transaksi kasir lengkap dengan item, pembayaran, outlet, dan ringkasan total."
    >
      <InlineAlert tone="error" message={error} />

      {isLoading ? (
        <AppLoader label="Memuat detail transaksi..." />
      ) : !transaction ? (
        <AppErrorState
          title="Transaksi tidak ditemukan"
          description="Data transaksi yang diminta belum tersedia atau tidak dapat diakses."
          actionLabel="Kembali ke histori"
          actionHref="/transactions"
          fullScreen={false}
        />
      ) : (
        <div className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {transaction.transactionNumber}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {formatDateTime(transaction.createdAt)} · {transaction.outletName} · {transaction.userName}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <TransactionStatusBadge status={transaction.status} />
                <Link
                  to="/transactions"
                  className="app-no-print rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-800 dark:text-gray-200"
                >
                  Kembali ke histori
                </Link>
              </div>
            </div>
          </section>

          <section className="app-no-print rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Customer</h4>
            <dl className="mt-4 grid gap-3 md:grid-cols-2 text-sm">
              <div className="rounded-2xl border border-gray-200 px-4 py-3 dark:border-gray-800">
                <dt className="text-gray-500 dark:text-gray-400">Tipe</dt>
                <dd className="mt-1 font-medium text-gray-900 dark:text-white">{transaction.customerType}</dd>
              </div>
              <div className="rounded-2xl border border-gray-200 px-4 py-3 dark:border-gray-800">
                <dt className="text-gray-500 dark:text-gray-400">Nama</dt>
                <dd className="mt-1 font-medium text-gray-900 dark:text-white">{transaction.customerName ?? transaction.externalCustomerName ?? "Guest"}</dd>
              </div>
              <div className="rounded-2xl border border-gray-200 px-4 py-3 dark:border-gray-800">
                <dt className="text-gray-500 dark:text-gray-400">Phone</dt>
                <dd className="mt-1 font-medium text-gray-900 dark:text-white">{transaction.customerPhone ?? transaction.externalCustomerPhone ?? "-"}</dd>
              </div>
              <div className="rounded-2xl border border-gray-200 px-4 py-3 dark:border-gray-800">
                <dt className="text-gray-500 dark:text-gray-400">External Ref</dt>
                <dd className="mt-1 font-medium text-gray-900 dark:text-white">{transaction.externalCustomerReference ?? "-"}</dd>
              </div>
            </dl>
          </section>

          <ReceiptCard transaction={transaction} />

          <TransactionActionPanel
            transaction={transaction}
            onUpdated={setTransaction}
          />

          <section className="app-no-print rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Item transaksi & status refund</h4>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-950">
                  <tr>
                    {["Produk", "SKU", "Qty", "Refunded", "Sisa", "Harga", "Diskon", "Line Total"].map((column) => (
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
                  {transaction.items.map((item) => (
                    <tr key={`${transaction.id}-${item.id}`}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {item.productName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{item.sku}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{item.qty}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{item.returnedQty}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{item.remainingQty}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {formatCurrency(item.discountAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="app-no-print grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Pembayaran</h4>
              <div className="mt-4 space-y-3">
                {transaction.payments.map((payment, index) => (
                  <div
                    key={`${payment.method}-${index}`}
                    className="rounded-2xl border border-gray-200 px-4 py-3 dark:border-gray-800"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatPaymentMethod(payment.method)}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                    {payment.referenceNumber ? (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Ref: {payment.referenceNumber}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Ringkasan</h4>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Subtotal</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(transaction.subtotal)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Diskon manual</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(transaction.manualDiscountTotal)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Promo</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(transaction.promoDiscountTotal)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Voucher</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(transaction.voucherDiscountTotal)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Service charge</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(transaction.serviceChargeTotal)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Pajak</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(transaction.taxTotal)}
                  </dd>
                </div>
                {transaction.appliedPromoName ? (
                  <div className="flex items-center justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Promo aktif</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{transaction.appliedPromoName}</dd>
                  </div>
                ) : null}
                {transaction.appliedVoucherCode ? (
                  <div className="flex items-center justify-between">
                    <dt className="text-gray-500 dark:text-gray-400">Voucher</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{transaction.appliedVoucherCode}</dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-800">
                  <dt className="font-semibold text-gray-900 dark:text-white">Grand Total</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(transaction.grandTotal)}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {transaction.returns.length > 0 ? (
            <section className="app-no-print rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Histori refund</h4>
              <div className="mt-4 space-y-3">
                {transaction.returns.map((itemReturn) => (
                  <div
                    key={itemReturn.id}
                    className="rounded-2xl border border-gray-200 px-4 py-3 dark:border-gray-800"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {itemReturn.productName}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {formatDateTime(itemReturn.createdAt)} · {itemReturn.processedByName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          Qty {itemReturn.qty}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatPaymentMethod(itemReturn.refundMethod)}
                        </p>
                      </div>
                    </div>
                    {itemReturn.reason ? (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {itemReturn.reason}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </ProtectedPageShell>
  );
}

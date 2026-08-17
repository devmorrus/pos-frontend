import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppErrorState, AppLoader, InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { getTransactionById, payTransactionDue } from "../api/transactionsApi";
import type { TransactionDto } from "../types/transaction";
import {
  formatCurrency,
  formatDateTime,
  formatPaymentMethod,
} from "../utils/formatters";
import TransactionActionPanel from "../components/TransactionActionPanel";
import ReceiptCard from "../components/ReceiptCard";
import TransactionStatusBadge from "../components/TransactionStatusBadge";
import AccountingPostingBadge from "../../accounting-integrations/components/AccountingPostingBadge";

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [transaction, setTransaction] = useState<TransactionDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for pay due (pelunasan)
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payRef, setPayRef] = useState("");
  const [isPayingDue, setIsPayingDue] = useState(false);
  const [payDueError, setPayDueError] = useState<string | null>(null);

  async function handlePayDue() {
    if (!id || !transaction) return;
    const amount = Number(payAmount);
    if (isNaN(amount) || amount <= 0 || amount > transaction.dueAmount) {
      setPayDueError("Nominal pembayaran tidak valid.");
      return;
    }
    if (payMethod !== "cash" && !payRef.trim()) {
      setPayDueError("Nomor referensi wajib diisi untuk non-tunai.");
      return;
    }

    setIsPayingDue(true);
    setPayDueError(null);

    try {
      const updated = await payTransactionDue(id, {
        amount,
        method: payMethod,
        referenceNumber: payRef.trim() || null
      });
      setTransaction(updated);
      setPayAmount("");
      setPayRef("");
      setPayDueError(null);
    } catch (requestError) {
      setPayDueError(getErrorMessage(requestError, "Gagal memproses pelunasan."));
    } finally {
      setIsPayingDue(false);
    }
  }

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
                <AccountingPostingBadge
                  referenceType="transaction_sale"
                  referenceId={transaction.id}
                />
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
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 space-y-6">
              <div>
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

              {transaction.dueAmount > 0 && (
                <div className="border-t border-gray-200 pt-6 dark:border-gray-800 space-y-4">
                  <h5 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Pelunasan Piutang / Kasbon</h5>
                  
                  <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">Sisa Piutang Berjalan</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        {transaction.paymentDueDate ? `Jatuh tempo: ${formatDateTime(transaction.paymentDueDate)}` : "Tanpa jatuh tempo"}
                      </p>
                    </div>
                    <span className="text-lg font-bold">{formatCurrency(transaction.dueAmount)}</span>
                  </div>

                  {payDueError && <InlineAlert tone="error" message={payDueError} />}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Metode Pelunasan
                      </label>
                      <select
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value)}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      >
                        <option value="cash">Cash</option>
                        <option value="qris">QRIS</option>
                        <option value="transfer">Transfer</option>
                        <option value="edc">EDC</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Nominal Pembayaran
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={transaction.dueAmount}
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="Jumlah bayar"
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-955 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Nomor Referensi {payMethod !== "cash" && "*"}
                    </label>
                    <input
                      type="text"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      placeholder={payMethod === "cash" ? "Opsional" : "Struk EDC / Ref transfer bank (wajib)"}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-955 dark:text-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void handlePayDue()}
                    disabled={isPayingDue || !payAmount || Number(payAmount) <= 0 || Number(payAmount) > transaction.dueAmount || (payMethod !== "cash" && !payRef.trim())}
                    className="w-full h-11 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold rounded-xl text-sm flex items-center justify-center transition-all shadow-lg hover:shadow-brand-500/20"
                  >
                    {isPayingDue ? "Memproses pelunasan..." : "Catat Pembayaran"}
                  </button>
                </div>
              )}
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
                {transaction.dueAmount > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <dt className="text-gray-500 dark:text-gray-400">Telah Dibayar</dt>
                      <dd className="font-semibold text-success-700 dark:text-success-400">
                        {formatCurrency(transaction.amountPaid)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-gray-500 dark:text-gray-400">Sisa Piutang</dt>
                      <dd className="font-bold text-error-700 dark:text-error-400">
                        {formatCurrency(transaction.dueAmount)}
                      </dd>
                    </div>
                  </>
                )}
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

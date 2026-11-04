import { useMemo, useState } from "react";
import { ConfirmDialog, InlineAlert } from "../../../components/ui";
import { useAuth } from "../../auth/hooks/useAuth";
import { refundTransaction, voidTransaction } from "../api/transactionsApi";
import type {
  RefundTransactionRequest,
  TransactionDto,
} from "../types/transaction";
import { getErrorMessage } from "../../../utils/errors";

type TransactionActionPanelProps = {
  transaction: TransactionDto;
  onUpdated: (transaction: TransactionDto) => void;
};

export default function TransactionActionPanel({
  transaction,
  onUpdated,
}: TransactionActionPanelProps) {
  const { session } = useAuth();
  const [voidReason, setVoidReason] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundMethod, setRefundMethod] = useState<"refund" | "exchange">("refund");
  const [refundQtyByItemId, setRefundQtyByItemId] = useState<Record<string, string>>({});
  const [refundBatchQty, setRefundBatchQty] = useState<Record<string, Record<string, string>>>({});
  const [refundSerialIds, setRefundSerialIds] = useState<Record<string, string[]>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [confirmVoidOpen, setConfirmVoidOpen] = useState(false);

  const canVoid = session?.role === "Owner" || session?.role === "Admin";
  const canRefund =
    session?.role === "Owner" ||
    session?.role === "Admin" ||
    session?.role === "Kasir" ||
    session?.role === "KepalaCabang";
  const hasReturns = transaction.returns.length > 0;
  const hasRefundableItems = useMemo(
    () => transaction.items.some((item) => item.remainingQty > 0),
    [transaction.items],
  );
  const voidDisabled = transaction.status !== "completed" || hasReturns;
  const refundDisabled =
    transaction.status === "voided" || !hasRefundableItems;

  async function handleVoidConfirm() {
    const trimmedReason = voidReason.trim();
    if (!trimmedReason) {
      setError("Alasan void wajib diisi.");
      return;
    }
    if (trimmedReason.length < 5) {
      setError("Alasan void harus minimal 5 karakter.");
      return;
    }

    setIsBusy(true);
    setError(null);
    setFeedback(null);

    try {
      const updated = await voidTransaction(transaction.id, {
        reason: trimmedReason,
      });
      onUpdated(updated);
      setFeedback("Transaksi berhasil di-void dan stok sudah dikembalikan.");
      setVoidReason("");
      setConfirmVoidOpen(false);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal melakukan void transaksi."));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRefundSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedReason = refundReason.trim();
    if (!trimmedReason) {
      setError("Alasan refund wajib diisi.");
      return;
    }
    if (trimmedReason.length < 5) {
      setError("Alasan refund harus minimal 5 karakter.");
      return;
    }

    const items = transaction.items
      .map((item) => ({
        productId: item.productId,
        productVariantId: item.productVariantId,
        transactionItemId: item.id,
        qty: Number(refundQtyByItemId[item.id] || 0),
        batchAllocations: item.trackingMode === "batch"
          ? (item.batches ?? []).flatMap((batch) => {
              const qty = Number(refundBatchQty[item.id]?.[batch.productBatchId]) || 0;
              return qty > 0 ? [{ productBatchId: batch.productBatchId, qty }] : [];
            })
          : null,
        serialIds: item.trackingMode === "serial" ? refundSerialIds[item.id] ?? [] : null,
      }))
      .filter((item) => item.qty > 0);

    if (items.length === 0) {
      setError("Isi minimal satu qty refund sebelum memproses refund.");
      return;
    }

    for (const rItem of items) {
      const trxItem = transaction.items.find((item) => item.id === rItem.transactionItemId);
      if (trxItem && rItem.qty > trxItem.remainingQty) {
        setError(`Jumlah refund untuk ${trxItem.productName} tidak boleh melebihi sisa Qty (${trxItem.remainingQty}).`);
        return;
      }
      if (trxItem?.trackingMode === "batch" &&
          Math.abs((rItem.batchAllocations?.reduce((sum, batch) => sum + batch.qty, 0) ?? 0) - rItem.qty) >= 0.000001) {
        setError(`Total batch refund untuk ${trxItem.productName} harus tepat ${rItem.qty}.`);
        return;
      }
      if (trxItem?.trackingMode === "batch" && rItem.batchAllocations?.some((allocation) => {
        const batch = trxItem.batches.find((entry) => entry.productBatchId === allocation.productBatchId);
        return !batch || allocation.qty > (batch.remainingQty ?? batch.qty);
      })) {
        setError(`Qty batch refund untuk ${trxItem.productName} melebihi sisa yang dapat direfund.`);
        return;
      }
      if (trxItem?.trackingMode === "serial" && rItem.serialIds?.length !== rItem.qty) {
        setError(`Pilih tepat ${rItem.qty} serial/IMEI untuk refund ${trxItem.productName}.`);
        return;
      }
    }

    setIsBusy(true);
    setError(null);
    setFeedback(null);

    const payload: RefundTransactionRequest = {
      refundMethod,
      reason: trimmedReason,
      items,
    };

    try {
      const updated = await refundTransaction(transaction.id, payload);
      onUpdated(updated);
      setRefundQtyByItemId({});
      setRefundBatchQty({});
      setRefundSerialIds({});
      setRefundReason("");
      setRefundMethod("refund");
      setFeedback("Refund berhasil diproses dan stok sudah dikembalikan.");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memproses refund transaksi."));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Aksi transaksi
          </h4>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Void dipakai untuk membatalkan seluruh transaksi. Refund dasar dipakai untuk pengembalian sebagian atau seluruh item.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="app-no-print rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-800 dark:text-gray-200"
        >
          Print struk
        </button>
      </div>

      <div className="mt-5 space-y-3">
        <InlineAlert tone="success" message={feedback} />
        <InlineAlert tone="error" message={error} />
      </div>

      {transaction.voidedReason ? (
        <div className="mt-5 rounded-2xl bg-error-50 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:text-error-300">
          Void reason: {transaction.voidedReason}
          {transaction.voidedByName ? ` · oleh ${transaction.voidedByName}` : ""}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
          <h5 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            Void transaksi
          </h5>
          <textarea
            value={voidReason}
            onChange={(event) => setVoidReason(event.target.value)}
            rows={4}
            placeholder="Alasan pembatalan transaksi (wajib, min. 5 karakter) *"
            className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
          />
          {voidReason && voidReason.trim().length < 5 && (
            <p className="text-xs text-error-600 mt-1">Minimal 5 karakter.</p>
          )}
          <button
            type="button"
            onClick={() => setConfirmVoidOpen(true)}
            disabled={!canVoid || voidDisabled || voidReason.trim().length < 5 || isBusy}
            className="mt-4 inline-flex items-center rounded-xl bg-error-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Void transaksi
          </button>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Hanya Owner/Admin. Void tidak tersedia jika transaksi sudah refund atau bukan status completed.
          </p>
        </div>

        <form
          onSubmit={handleRefundSubmit}
          className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800"
        >
          <h5 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            Refund dasar
          </h5>
          <div className="mt-3 space-y-3">
            <select
              value={refundMethod}
              onChange={(event) =>
                setRefundMethod(event.target.value as "refund" | "exchange")
              }
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            >
              <option value="refund">Refund</option>
              <option value="exchange">Exchange</option>
            </select>
            <textarea
              value={refundReason}
              onChange={(event) => setRefundReason(event.target.value)}
              rows={3}
              placeholder="Catatan/Alasan refund (wajib, min. 5 karakter) *"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            />
            {refundReason && refundReason.trim().length < 5 && (
              <p className="text-xs text-error-600 mt-1">Minimal 5 karakter.</p>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {transaction.items.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-2xl border border-gray-200 p-3 dark:border-gray-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.productName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Terjual {item.qty} · Sudah refund {item.returnedQty} · Sisa {item.remainingQty}
                    </p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={item.remainingQty}
                    step="1"
                    value={refundQtyByItemId[item.id] ?? ""}
                    onChange={(event) =>
                      setRefundQtyByItemId((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }))
                    }
                    disabled={item.remainingQty <= 0}
                    className="h-11 w-28 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none disabled:opacity-60 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                {item.trackingMode === "batch" && Number(refundQtyByItemId[item.id] || 0) > 0 && (
                  <div className="space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                    <p className="text-xs font-semibold text-gray-500">Pilih batch yang dikembalikan</p>
                    {(item.batches ?? []).filter((batch) => (batch.remainingQty ?? batch.qty) > 0).map((batch) => (
                      <label key={batch.productBatchId} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-gray-700 dark:text-gray-200">{batch.batchNumber} · dapat direfund {batch.remainingQty ?? batch.qty}</span>
                        <input
                          type="number"
                          min="0"
                          max={batch.remainingQty ?? batch.qty}
                          step="0.01"
                          value={refundBatchQty[item.id]?.[batch.productBatchId] ?? ""}
                          onChange={(event) => setRefundBatchQty((current) => ({
                            ...current,
                            [item.id]: { ...current[item.id], [batch.productBatchId]: event.target.value },
                          }))}
                          className="h-9 w-24 rounded-xl border border-gray-200 bg-white px-2 text-right dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                        />
                      </label>
                    ))}
                  </div>
                )}
                {item.trackingMode === "serial" && Number(refundQtyByItemId[item.id] || 0) > 0 && (
                  <div className="space-y-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                    <p className="text-xs font-semibold text-gray-500">
                      Pilih serial/IMEI ({refundSerialIds[item.id]?.length ?? 0}/{Number(refundQtyByItemId[item.id] || 0)})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(item.serials ?? []).map((serial) => {
                        const checked = refundSerialIds[item.id]?.includes(serial.productSerialId) ?? false;
                        const full = serial.isReturned || (!checked && (refundSerialIds[item.id]?.length ?? 0) >= Number(refundQtyByItemId[item.id] || 0));
                        return (
                          <label key={serial.productSerialId} className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs dark:border-gray-800">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={full}
                              onChange={(event) => setRefundSerialIds((current) => ({
                                ...current,
                                [item.id]: event.target.checked
                                  ? [...(current[item.id] ?? []), serial.productSerialId]
                                  : (current[item.id] ?? []).filter((id) => id !== serial.productSerialId),
                              }))}
                            />
                            <span className="font-mono text-gray-700 dark:text-gray-200">{serial.serialNumber}{serial.isReturned ? " · returned" : ""}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={!canRefund || refundDisabled || refundReason.trim().length < 5 || isBusy}
            className="mt-4 inline-flex items-center rounded-xl bg-warning-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Proses refund
          </button>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Refund mengembalikan stok dan mencatat histori return per item.
          </p>
        </form>
      </div>

      <ConfirmDialog
        open={confirmVoidOpen}
        title="Void transaksi ini?"
        description="Seluruh stok akan dikembalikan dan transaksi tidak bisa diproses ulang sebagai penjualan aktif."
        confirmLabel="Ya, void transaksi"
        isBusy={isBusy}
        onCancel={() => setConfirmVoidOpen(false)}
        onConfirm={() => void handleVoidConfirm()}
      />
    </section>
  );
}

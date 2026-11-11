import { useEffect, useState } from "react";
import { InlineAlert } from "../../../components/ui";
import { Modal } from "../../../components/ui/modal";
import type { ReceiveStockTransferRequest, StockTransferDto } from "../types/inventory";
import { formatQuantity } from "../utils/presentation";

const reasons = [
  ["short_shipped", "Dikirim kurang"],
  ["lost_in_transit", "Hilang dalam perjalanan"],
  ["damaged", "Rusak / tidak layak"],
  ["over_shipped", "Dikirim lebih"],
  ["counting_error", "Perbedaan perhitungan"],
  ["other", "Lainnya"],
] as const;

function reasonsFor(difference: number) {
  const allowed = difference > 0
    ? ["over_shipped", "counting_error", "other"]
    : ["short_shipped", "lost_in_transit", "damaged", "counting_error", "other"];
  return reasons.filter(([value]) => allowed.includes(value));
}

type Draft = { receivedQty: string; reason: string; note: string };

export default function TransferReceiveModal({
  open, transfer, isSubmitting, submitError, onClose, onSubmit,
}: {
  open: boolean;
  transfer: StockTransferDto | null;
  isSubmitting: boolean;
  submitError?: string | null;
  onClose: () => void;
  onSubmit: (payload: ReceiveStockTransferRequest) => Promise<void>;
}) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [receiptNote, setReceiptNote] = useState("");
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !transfer) return;
    const currentTransfer = transfer;
    setDrafts(Object.fromEntries(currentTransfer.items.map((item) => [item.id, {
      receivedQty: String(item.sentQty ?? item.qty), reason: "", note: "",
    }])));
    setReceiptNote("");
    setRequestId(crypto.randomUUID());
    setValidationError(null);
  }, [open, transfer]);

  if (!open || !transfer) return null;
  const activeTransfer = transfer;

  function update(id: string, values: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...values } }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setValidationError(null);
    const items = activeTransfer.items.map((item) => {
      const draft = drafts[item.id];
      const receivedQty = Number(draft?.receivedQty);
      return { item, draft, receivedQty, difference: receivedQty - (item.sentQty ?? item.qty) };
    });
    if (items.some(({ receivedQty }) => !Number.isFinite(receivedQty) || receivedQty < 0)) {
      setValidationError("Qty diterima wajib berupa angka nol atau lebih."); return;
    }
    if (items.some(({ item, receivedQty }) => item.productSerialId && receivedQty !== 0 && receivedQty !== 1)) {
      setValidationError("Qty setiap serial harus nol atau satu."); return;
    }
    if (items.some(({ difference, draft }) => difference !== 0 && (!draft?.reason || !draft.note.trim()))) {
      setValidationError("Alasan dan catatan wajib diisi untuk setiap item yang memiliki selisih."); return;
    }
    await onSubmit({
      requestId,
      receiptNote: receiptNote.trim() || null,
      items: items.map(({ item, draft, receivedQty, difference }) => ({
        transferItemId: item.id,
        receivedQty,
        varianceReasonCode: difference === 0 ? null : draft.reason,
        varianceNote: difference === 0 ? null : draft.note.trim(),
      })),
    });
  }

  return <Modal isOpen={open} onClose={onClose} className="max-h-[92vh] max-w-5xl overflow-y-auto p-6 sm:p-8">
    <form className="space-y-5" onSubmit={submit}>
      <div><h3 className="text-xl font-semibold text-gray-900 dark:text-white">Periksa & terima {activeTransfer.transferNumber}</h3><p className="mt-1 text-sm text-gray-500">Masukkan jumlah fisik yang layak masuk stok tujuan.</p></div>
      <InlineAlert tone="error" message={submitError ?? validationError} />
      <div className="space-y-3">{activeTransfer.items.map((item) => {
        const draft = drafts[item.id] ?? { receivedQty: "", reason: "", note: "" };
        const sent = item.sentQty ?? item.qty;
        const received = Number(draft.receivedQty);
        const difference = Number.isFinite(received) ? received - sent : 0;
        return <div key={item.id} className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
          <div className="mb-3 flex flex-wrap justify-between gap-2"><div><p className="font-semibold text-gray-900 dark:text-white">{item.productName}</p><p className="text-xs text-gray-500">{item.sku}{item.batchNumber ? ` · batch ${item.batchNumber}` : item.serialNumber ? ` · serial ${item.serialNumber}` : ""}</p></div><p className="text-sm text-gray-500">Dikirim <strong className="text-gray-900 dark:text-white">{formatQuantity(sent)}</strong></p></div>
          <div className="grid gap-3 md:grid-cols-3"><label className="text-sm text-gray-700 dark:text-gray-200">Qty diterima<input type="number" min="0" step={item.productSerialId ? "1" : "0.01"} value={draft.receivedQty} onChange={(e) => update(item.id, { receivedQty: e.target.value, reason: "" })} className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 dark:border-gray-800 dark:bg-gray-950" /></label><div className="text-sm text-gray-700 dark:text-gray-200">Selisih<div className={`mt-1 flex h-11 items-center rounded-xl px-3 font-semibold ${difference === 0 ? "bg-success-50 text-success-700" : "bg-warning-50 text-warning-700"}`}>{difference > 0 ? "+" : ""}{formatQuantity(difference)}</div></div>{difference !== 0 && <label className="text-sm text-gray-700 dark:text-gray-200">Alasan<select value={draft.reason} onChange={(e) => update(item.id, { reason: e.target.value })} className="mt-1 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 dark:border-gray-800 dark:bg-gray-950"><option value="">Pilih alasan</option>{reasonsFor(difference).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}</div>
          {difference !== 0 && <textarea value={draft.note} onChange={(e) => update(item.id, { note: e.target.value })} maxLength={500} placeholder="Jelaskan kondisi selisih..." className="mt-3 min-h-20 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-800 dark:bg-gray-950" />}
        </div>;
      })}</div>
      <label className="block text-sm text-gray-700 dark:text-gray-200">Catatan penerimaan<textarea value={receiptNote} onChange={(e) => setReceiptNote(e.target.value)} maxLength={500} className="mt-1 min-h-20 w-full rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950" /></label>
      <div className="flex justify-end gap-3"><button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-800">Batal</button><button type="submit" disabled={isSubmitting} className="rounded-xl bg-success-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{isSubmitting ? "Memproses..." : "Selesaikan penerimaan"}</button></div>
    </form>
  </Modal>;
}

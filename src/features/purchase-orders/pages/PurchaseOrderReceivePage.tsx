import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { getPurchaseOrderById, receivePurchaseOrderGoods } from "../api/purchaseOrdersApi";
import type { PurchaseOrderDto } from "../types/purchaseOrder";

interface ReceiveRow {
  productId: string;
  productVariantId: string | null;
  productName: string;
  sku: string;
  qtyOrdered: number;
  qtyReceivedSoFar: number;
  qtyToReceive: string; // string for input state
  batchNumber: string;
  expiryDate: string;
}

export default function PurchaseOrderReceivePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<PurchaseOrderDto | null>(null);
  const [rows, setRows] = useState<ReceiveRow[]>([]);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      if (!id) {
        setError("ID Purchase Order tidak valid.");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const po = await getPurchaseOrderById(id);
        setOrder(po);

        // Initialize rows
        const initialRows: ReceiveRow[] = po.items.map((item) => {
          const remaining = Math.max(0, item.qty - item.qtyReceived);
          return {
            productId: item.productId,
            productVariantId: item.productVariantId ?? null,
            productName: item.productName,
            sku: item.sku,
            qtyOrdered: item.qty,
            qtyReceivedSoFar: item.qtyReceived,
            qtyToReceive: remaining > 0 ? remaining.toString() : "0",
            batchNumber: "",
            expiryDate: "",
          };
        });
        setRows(initialRows);
      } catch (err) {
        setError(getErrorMessage(err, "Gagal memuat data Purchase Order."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadOrder();
  }, [id]);

  const handleRowChange = (index: number, field: keyof ReceiveRow, value: string) => {
    setRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !order) return;

    // Validate quantities
    const itemsPayload = rows
      .map((row) => ({
        productId: row.productId,
        productVariantId: row.productVariantId,
        qtyReceived: parseFloat(row.qtyToReceive) || 0,
        batchNumber: row.batchNumber.trim() || null,
        expiryDate: row.expiryDate ? new Date(row.expiryDate).toISOString() : null,
      }))
      .filter((item) => item.qtyReceived > 0);

    if (itemsPayload.length === 0) {
      setError("Mohon masukkan jumlah yang diterima minimal 1 unit untuk salah satu item.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await receivePurchaseOrderGoods(id, {
        outletId: order.outletId,
        notes: notes.trim() || null,
        items: itemsPayload,
      });

      navigate(`/purchase-orders/${id}`, {
        state: { successMessage: "Penerimaan barang berhasil disimpan dan stok telah diperbarui." },
      });
    } catch (err) {
      setError(getErrorMessage(err, "Gagal menyimpan penerimaan barang."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedPageShell
      title="Penerimaan Barang PO"
      description={`Mencatat penerimaan barang masuk untuk Purchase Order #${order?.poNumber ?? ""}.`}
    >
      <InlineAlert tone="error" message={error} />

      {isLoading ? (
        <AppLoader label="Memuat data Purchase Order..." />
      ) : !order ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Purchase Order tidak ditemukan.</p>
          <Link
            to="/purchase-orders"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-xs hover:bg-brand-600"
          >
            Kembali ke Daftar PO
          </Link>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informasi Dokumen</h3>
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">No. PO</p>
                <p className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white">{order.poNumber}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Supplier</p>
                <p className="mt-1.5 text-base text-gray-700 dark:text-gray-200">{order.supplierName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Outlet</p>
                <p className="mt-1.5 text-base text-gray-700 dark:text-gray-200">{order.outletName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Status PO</p>
                <p className="mt-1.5 text-base capitalize text-gray-700 dark:text-gray-200">{order.status}</p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Item Penerimaan</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-950">
                  <tr>
                    {["Produk / SKU", "Pesan", "Diterima", "Kuantitas Masuk", "No. Batch (Opsional)", "Exp. Date (Opsional)"].map((column) => (
                      <th
                        key={column}
                        className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-gray-500"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {rows.map((row, index) => (
                    <tr key={row.productId + (row.productVariantId ?? "")}>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{row.productName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{row.sku}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                        {row.qtyOrdered}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {row.qtyReceivedSoFar}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={row.qtyToReceive}
                          onChange={(e) => handleRowChange(index, "qtyToReceive", e.target.value)}
                          className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-950 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                          required
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          placeholder="BATCH-123"
                          value={row.batchNumber}
                          onChange={(e) => handleRowChange(index, "batchNumber", e.target.value)}
                          className="w-full min-w-[120px] rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-950 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="date"
                          value={row.expiryDate}
                          onChange={(e) => handleRowChange(index, "expiryDate", e.target.value)}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-950 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
            <div className="space-y-4">
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-900 dark:text-white">
                Catatan Penerimaan
              </label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Catatan tambahan mengenai kondisi barang yang diterima..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-950 shadow-theme-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <Link
              to={`/purchase-orders/${id}`}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-850"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-theme-xs hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Penerimaan"}
            </button>
          </div>
        </form>
      )}
    </ProtectedPageShell>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, ConfirmDialog, InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { formatCurrency, formatDateOnly, formatDateTime, getPoStatusClasses } from "../../procurement/utils/formatters";
import { getPurchaseOrderById, updatePurchaseOrderStatus } from "../api/purchaseOrdersApi";
import type { PurchaseOrderDto } from "../types/purchaseOrder";
import AccountingPostingBadge from "../../accounting-integrations/components/AccountingPostingBadge";

type PurchaseOrderDetailLocationState = {
  successMessage?: string;
};

const statusActions: Record<string, { label: string; nextStatus: string }[]> = {
  draft: [
    { label: "Kirim ke pending", nextStatus: "pending" },
    { label: "Selesaikan PO", nextStatus: "completed" },
    { label: "Batalkan PO", nextStatus: "cancelled" },
  ],
  pending: [
    { label: "Selesaikan PO", nextStatus: "completed" },
    { label: "Batalkan PO", nextStatus: "cancelled" },
  ],
};

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [order, setOrder] = useState<PurchaseOrderDto | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as PurchaseOrderDetailLocationState | null)?.successMessage ?? null,
  );

  async function loadOrder() {
    if (!id) {
      setError("Purchase order tidak valid.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setOrder(await getPurchaseOrderById(id));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat detail purchase order."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadOrder();
  }, [id]);

  const availableActions = useMemo(
    () => (order ? statusActions[order.status] ?? [] : []),
    [order],
  );

  const negativeMarginItems = useMemo(() => {
    if (!order || pendingStatus !== "completed") return [];
    return order.items.filter((item) => item.unitCost > item.sellingPrice);
  }, [order, pendingStatus]);

  const confirmDescription = useMemo(() => {
    if (!pendingStatus) return "";
    return (
      <div className="space-y-3 text-left">
        <p>
          Anda yakin ingin mengubah status purchase order ini menjadi{" "}
          <span className="font-semibold">{pendingStatus}</span>?
        </p>
        {pendingStatus === "completed" && negativeMarginItems.length > 0 && (
          <div className="rounded-2xl bg-error-50 p-4 text-error-700 dark:bg-error-500/10 dark:text-error-300 space-y-2">
            <p className="font-semibold flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <span>⚠️</span> Peringatan Margin Negatif
            </p>
            <p className="text-xs">
              Unit Cost (harga beli) melebihi Harga Jual saat ini untuk item berikut:
            </p>
            <ul className="list-disc pl-4 text-xs space-y-1">
              {negativeMarginItems.map((item) => (
                <li key={item.productId}>
                  {item.productName}: {formatCurrency(item.unitCost)} vs Jual {formatCurrency(item.sellingPrice)}
                </li>
              ))}
            </ul>
            <p className="text-xs font-semibold pt-1">
              Apakah Anda tetap ingin menyelesaikan PO ini dan memperbarui harga modal produk?
            </p>
          </div>
        )}
      </div>
    );
  }, [pendingStatus, negativeMarginItems]);

  async function handleStatusConfirm() {
    if (!id || !pendingStatus) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updatePurchaseOrderStatus(id, { status: pendingStatus });
      setOrder(result);
      setSuccessMessage(`Status PO ${result.poNumber} berhasil diubah menjadi ${pendingStatus}.`);
      setPendingStatus(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal mengubah status purchase order."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Detail Purchase Order"
      description="Lihat item pembelian, total tagihan, dan proses perubahan status purchase order supplier."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      {isLoading ? (
        <AppLoader label="Memuat detail purchase order..." />
      ) : !order ? null : (
        <div className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">No. PO</p>
                  <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">{order.poNumber}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Supplier</p>
                  <p className="mt-2 text-base text-gray-700 dark:text-gray-200">{order.supplierName}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Outlet</p>
                  <p className="mt-2 text-base text-gray-700 dark:text-gray-200">{order.outletName}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Tanggal PO</p>
                  <p className="mt-2 text-base text-gray-700 dark:text-gray-200">{formatDateTime(order.poDate)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Payment Type</p>
                  <p className="mt-2 text-base capitalize text-gray-700 dark:text-gray-200">{order.paymentType}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Jatuh Tempo</p>
                  <p className="mt-2 text-base text-gray-700 dark:text-gray-200">{formatDateOnly(order.dueDate)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPoStatusClasses(order.status)}`}>
                    {order.status}
                  </span>
                  <AccountingPostingBadge
                    referenceType="purchase_order"
                    referenceId={order.id}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/purchase-orders"
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                  >
                    Kembali ke daftar
                  </Link>
                  {(order.status === "pending" || order.status === "partially_received") && (
                    <Link
                      to={`/purchase-orders/${order.id}/receive`}
                      className="rounded-xl bg-green-600 hover:bg-green-700 px-4 py-2 text-sm font-semibold text-white inline-flex items-center"
                    >
                      Terima Barang
                    </Link>
                  )}
                  {availableActions.map((action) => (
                    <button
                      key={action.nextStatus}
                      type="button"
                      onClick={() => setPendingStatus(action.nextStatus)}
                      className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Item purchase order</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-950">
                  <tr>
                    {["SKU", "Produk", "Qty", "Unit Cost", "Total"].map((column) => (
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
                  {order.items.map((item) => (
                    <tr key={item.productId}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.sku}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{item.productName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{item.qty}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(item.unitCost)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(item.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-950">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Total
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(order.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title="Ubah status purchase order"
        description={confirmDescription}
        confirmLabel="Proses status"
        isBusy={isSubmitting}
        onCancel={() => setPendingStatus(null)}
        onConfirm={() => void handleStatusConfirm()}
      />
    </ProtectedPageShell>
  );
}

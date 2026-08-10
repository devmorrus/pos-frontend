import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, ConfirmDialog, InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import {
  deleteSupplierReturn,
  getSupplierReturnById,
  updateSupplierReturnStatus,
} from "../api/supplierReturnsApi";
import type { SupplierReturnDto } from "../types/supplierReturn";
import {
  formatCurrency,
  formatDateTime,
  getSupplierReturnStatusClasses,
} from "../utils/formatters";

type LocationState = {
  successMessage?: string;
};

export default function SupplierReturnDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<SupplierReturnDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage] = useState<string | null>(
    (location.state as LocationState | null)?.successMessage ?? null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function loadDetail() {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      setDetail(await getSupplierReturnById(id));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat detail retur supplier."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDetail();
  }, [id]);

  async function handleStatus(status: "sent" | "completed") {
    if (!id) return;
    setIsBusy(true);
    setError(null);
    try {
      setDetail(await updateSupplierReturnStatus(id, { status }));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memperbarui status retur supplier."));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    setIsBusy(true);
    setError(null);
    try {
      await deleteSupplierReturn(id);
      navigate("/supplier-returns", {
        replace: true,
        state: { successMessage: "Retur supplier draft berhasil dihapus." },
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal menghapus retur supplier."));
      setIsBusy(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Detail Supplier Return"
      description="Pantau item, nilai retur, dan progres proses pengembalian barang ke supplier."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      {isLoading || !detail ? (
        <AppLoader label="Memuat detail retur supplier..." />
      ) : (
        <div className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">{detail.returnNumber}</p>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{detail.supplierName}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  PO {detail.purchaseOrderNumber} • Outlet {detail.outletName}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {detail.status === "draft" ? (
                  <>
                    <Link
                      to={`/supplier-returns/${detail.id}/edit`}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                    >
                      Edit draft
                    </Link>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleStatus("sent")}
                      className="rounded-xl bg-warning-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Kirim retur
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => setConfirmDelete(true)}
                      className="rounded-xl bg-error-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Hapus draft
                    </button>
                  </>
                ) : null}
                {detail.status === "sent" ? (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => void handleStatus("completed")}
                    className="rounded-xl bg-success-500 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Tandai selesai
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Status</p>
                <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getSupplierReturnStatusClasses(detail.status)}`}>
                  {detail.status}
                </span>
              </div>
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Tanggal retur</p>
                <p className="mt-3 text-sm font-medium text-gray-900 dark:text-white">{formatDateTime(detail.returnDate)}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Total retur</p>
                <p className="mt-3 text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(detail.totalAmount)}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Dibuat oleh</p>
                <p className="mt-3 text-sm font-medium text-gray-900 dark:text-white">{detail.createdByName}</p>
              </div>
            </div>

            {detail.notes ? (
              <div className="mt-6 rounded-2xl border border-dashed border-gray-300 p-4 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200">
                {detail.notes}
              </div>
            ) : null}
          </section>

          <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Item retur</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-950">
                <tr>
                  {["Produk", "Qty", "Unit Cost", "Subtotal"].map((column) => (
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
                {detail.items.map((item) => (
                  <tr key={item.productId}>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.sku}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{item.qty}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{formatCurrency(item.unitCost)}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Hapus retur supplier"
        description={`Retur ${detail?.returnNumber ?? ""} akan dihapus permanen karena masih draft.`}
        confirmLabel="Hapus draft"
        isBusy={isBusy}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </ProtectedPageShell>
  );
}

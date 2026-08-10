import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, ConfirmDialog, InlineAlert, PagePlaceholder } from "../../../components/ui";
import ProcurementOutletSelector from "../../procurement/components/ProcurementOutletSelector";
import { useProcurementOutletScope } from "../../procurement/hooks/useProcurementOutletScope";
import { getErrorMessage } from "../../../utils/errors";
import { getSuppliers } from "../../suppliers/api/suppliersApi";
import type { SupplierDto } from "../../suppliers/types/supplier";
import {
  deleteSupplierReturn,
  getSupplierReturns,
  updateSupplierReturnStatus,
} from "../api/supplierReturnsApi";
import type { SupplierReturnListItemDto } from "../types/supplierReturn";
import {
  formatCurrency,
  formatDateTime,
  getSupplierReturnStatusClasses,
} from "../utils/formatters";

export default function SupplierReturnsPage() {
  const { ownerMode, activeOutlets, effectiveOutletId, selectedOutletId, setSelectedOutletId } =
    useProcurementOutletScope();
  const [returns, setReturns] = useState<SupplierReturnListItemDto[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [supplierFilter, setSupplierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusyId, setIsBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplierReturnListItemDto | null>(null);

  async function loadData() {
    if (!effectiveOutletId) {
      setReturns([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [returnsResult, suppliersResult] = await Promise.all([
        getSupplierReturns({
          outletId: effectiveOutletId,
          supplierId: supplierFilter || undefined,
          status: statusFilter,
        }),
        getSuppliers(),
      ]);
      setReturns(returnsResult);
      setSuppliers(suppliersResult);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat retur supplier."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [effectiveOutletId, supplierFilter, statusFilter]);

  const shouldShowOutletPrompt = ownerMode && !effectiveOutletId;
  const activeSupplierName = useMemo(
    () => suppliers.find((supplier) => supplier.id === supplierFilter)?.name ?? "Semua supplier",
    [suppliers, supplierFilter],
  );

  async function handleStatus(id: string, status: "sent" | "completed") {
    setIsBusyId(id);
    setError(null);
    try {
      await updateSupplierReturnStatus(id, { status });
      await loadData();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memperbarui status retur supplier."));
    } finally {
      setIsBusyId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setIsBusyId(deleteTarget.id);
    setError(null);
    try {
      await deleteSupplierReturn(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal menghapus retur supplier."));
    } finally {
      setIsBusyId(null);
    }
  }

  return (
    <ProtectedPageShell
      title="Supplier Return"
      description="Kelola retur barang pembelian ke supplier hingga proses selesai dan stok outlet disesuaikan."
    >
      <InlineAlert tone="error" message={error} />

      <AppTableShell
        title="Daftar retur supplier"
        description={`${returns.length} retur • ${activeSupplierName}`}
        actions={
          <>
            <ProcurementOutletSelector
              ownerMode={ownerMode}
              value={selectedOutletId}
              onChange={setSelectedOutletId}
              outlets={activeOutlets}
            />
            <select
              value={supplierFilter}
              onChange={(event) => setSupplierFilter(event.target.value)}
              className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            >
              <option value="">Semua supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            >
              <option value="all">Semua status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="completed">Completed</option>
            </select>
            <Link
              to="/supplier-returns/create"
              className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Buat retur
            </Link>
          </>
        }
      >
        {isLoading ? (
          <AppLoader label="Memuat retur supplier..." />
        ) : shouldShowOutletPrompt ? (
          <div className="p-6">
            <PagePlaceholder
              title="Pilih outlet procurement terlebih dahulu"
              description="Owner perlu memilih outlet aktif agar data retur supplier menggunakan konteks cabang yang benar."
              status="Outlet required"
            />
          </div>
        ) : returns.length === 0 ? (
          <div className="p-6">
            <PagePlaceholder
              title="Belum ada retur supplier"
              description="Buat retur baru saat ada barang pembelian yang harus dikembalikan ke supplier."
              status="Empty"
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                {["No. Retur", "Tanggal", "Supplier", "PO", "Outlet", "Total", "Status", "Dibuat", "Aksi"].map((column) => (
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
              {returns.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.returnNumber}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{formatDateTime(item.returnDate)}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{item.supplierName}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{item.purchaseOrderNumber}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{item.outletName}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(item.totalAmount)}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSupplierReturnStatusClasses(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{item.createdByName}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/supplier-returns/${item.id}`}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                      >
                        Detail
                      </Link>
                      {item.status === "draft" ? (
                        <>
                          <Link
                            to={`/supplier-returns/${item.id}/edit`}
                            className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            disabled={isBusyId === item.id}
                            onClick={() => void handleStatus(item.id, "sent")}
                            className="rounded-xl bg-warning-500 px-3 py-2 text-xs font-semibold text-white"
                          >
                            Kirim
                          </button>
                          <button
                            type="button"
                            disabled={isBusyId === item.id}
                            onClick={() => setDeleteTarget(item)}
                            className="rounded-xl bg-error-500 px-3 py-2 text-xs font-semibold text-white"
                          >
                            Hapus
                          </button>
                        </>
                      ) : null}
                      {item.status === "sent" ? (
                        <button
                          type="button"
                          disabled={isBusyId === item.id}
                          onClick={() => void handleStatus(item.id, "completed")}
                          className="rounded-xl bg-success-500 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Selesaikan
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AppTableShell>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus retur supplier"
        description={`Retur ${deleteTarget?.returnNumber ?? ""} akan dihapus permanen karena masih draft.`}
        confirmLabel="Hapus draft"
        isBusy={deleteTarget !== null && isBusyId === deleteTarget.id}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </ProtectedPageShell>
  );
}

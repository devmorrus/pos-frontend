import { useEffect, useState } from "react";
import { Link } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { Modal } from "../../../components/ui/modal";
import { getErrorMessage } from "../../../utils/errors";
import ProcurementOutletSelector from "../../procurement/components/ProcurementOutletSelector";
import { useProcurementOutletScope } from "../../procurement/hooks/useProcurementOutletScope";
import { formatCurrency, formatDateOnly, getDebtStatusClasses } from "../../procurement/utils/formatters";
import { getSupplierDebtByPoId, getSupplierDebts, paySupplierDebt } from "../api/debtsApi";
import PaySupplierDebtModal from "../components/PaySupplierDebtModal";
import type { SupplierDebtDto, SupplierPaymentFormValues } from "../types/debt";

export default function SupplierDebtsPage() {
  const { ownerMode, activeOutlets, effectiveOutletId, selectedOutletId, setSelectedOutletId } =
    useProcurementOutletScope();
  const [debts, setDebts] = useState<SupplierDebtDto[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailPoId, setDetailPoId] = useState<string | null>(null);
  const [detailDebt, setDetailDebt] = useState<SupplierDebtDto | null>(null);
  const [payTarget, setPayTarget] = useState<SupplierDebtDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadDebts() {
    if (!effectiveOutletId) {
      setDebts([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setDebts(await getSupplierDebts({ outletId: effectiveOutletId, status: statusFilter }));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat daftar utang supplier."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDebts();
  }, [effectiveOutletId, statusFilter]);

  useEffect(() => {
    async function loadDetail() {
      if (!detailPoId) {
        setDetailDebt(null);
        return;
      }

      setIsLoadingDetail(true);

      try {
        setDetailDebt(await getSupplierDebtByPoId(detailPoId));
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat detail utang supplier."));
      } finally {
        setIsLoadingDetail(false);
      }
    }

    void loadDetail();
  }, [detailPoId]);

  const shouldShowOutletPrompt = ownerMode && !effectiveOutletId;

  async function handlePayDebt(values: SupplierPaymentFormValues) {
    if (!payTarget) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await paySupplierDebt({
        purchaseOrderId: payTarget.purchaseOrderId,
        amount: Number(values.amount),
        paymentMethod: values.paymentMethod.trim(),
        referenceNumber: values.referenceNumber.trim() || null,
      });
      setSuccessMessage(`Pembayaran utang untuk PO ${payTarget.poNumber} berhasil dicatat.`);
      setPayTarget(null);
      await loadDebts();

      if (detailPoId === payTarget.purchaseOrderId) {
        setDetailDebt(await getSupplierDebtByPoId(payTarget.purchaseOrderId));
      }
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError, "Gagal menyimpan pembayaran utang supplier."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Utang Supplier"
      description="Monitor utang usaha supplier, lihat detail tagihan per PO, dan catat pembayaran parsial atau pelunasan."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      <AppTableShell
        title="Daftar utang supplier"
        description={`Total tagihan: ${debts.length}`}
        actions={
          <>
            <ProcurementOutletSelector
              ownerMode={ownerMode}
              value={selectedOutletId}
              onChange={setSelectedOutletId}
              outlets={activeOutlets}
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            >
              <option value="all">Semua status</option>
              <option value="unpaid">Unpaid</option>
              <option value="partially_paid">Partially paid</option>
              <option value="paid">Paid</option>
            </select>
            <Link
              to="/supplier-debts/payments"
              className="inline-flex items-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
            >
              Histori pembayaran
            </Link>
          </>
        }
      >
        {isLoading ? (
          <AppLoader label="Memuat daftar utang supplier..." />
        ) : shouldShowOutletPrompt ? (
          <div className="p-6">
            <PagePlaceholder
              title="Pilih outlet procurement terlebih dahulu"
              description="Owner perlu memilih outlet aktif sebelum memuat daftar utang dan histori pembayaran supplier."
              status="Outlet required"
            />
          </div>
        ) : debts.length === 0 ? (
          <div className="p-6">
            <PagePlaceholder
              title="Belum ada utang supplier"
              description="Belum ada purchase order tempo yang membentuk utang pada outlet ini."
              status="Empty"
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                {["Supplier", "No. PO", "Jatuh Tempo", "Nilai Utang", "Terbayar", "Sisa", "Status", "Aksi"].map((column) => (
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
              {debts.map((debt) => (
                <tr key={debt.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{debt.supplierName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{debt.poNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{formatDateOnly(debt.dueDate)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{formatCurrency(debt.amount)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{formatCurrency(debt.paidAmount)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(debt.remainingAmount)}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getDebtStatusClasses(debt.status)}`}>
                      {debt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailPoId(debt.purchaseOrderId)}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                      >
                        Detail
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayTarget(debt)}
                        disabled={debt.status === "paid"}
                        className="rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        Bayar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AppTableShell>

      <Modal isOpen={Boolean(detailPoId)} onClose={() => setDetailPoId(null)} className="max-w-2xl p-6 sm:p-8">
        <div className="space-y-5">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Detail utang supplier</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Ringkasan tagihan supplier berdasarkan purchase order yang dipilih.
            </p>
          </div>
          {isLoadingDetail ? (
            <AppLoader label="Memuat detail utang..." />
          ) : detailDebt ? (
            <div className="grid gap-4 rounded-2xl border border-gray-200 p-4 text-sm dark:border-gray-800 md:grid-cols-2">
              <div>
                <p className="text-gray-500">Supplier</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{detailDebt.supplierName}</p>
              </div>
              <div>
                <p className="text-gray-500">No. PO</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{detailDebt.poNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Jatuh tempo</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{formatDateOnly(detailDebt.dueDate)}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{detailDebt.status}</p>
              </div>
              <div>
                <p className="text-gray-500">Nilai utang</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{formatCurrency(detailDebt.amount)}</p>
              </div>
              <div>
                <p className="text-gray-500">Terbayar</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{formatCurrency(detailDebt.paidAmount)}</p>
              </div>
              {detailDebt.soldAmount !== undefined && (
                <div>
                  <p className="text-gray-500">Total barang laku</p>
                  <p className="mt-1 font-medium text-gray-900 dark:text-white">{formatCurrency(detailDebt.soldAmount)}</p>
                </div>
              )}
              {detailDebt.maxPayableAmount !== undefined && (
                <div>
                  <p className="text-gray-500">Maksimum pembayaran saat ini</p>
                  <p className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(detailDebt.maxPayableAmount)}</p>
                </div>
              )}
              <div className="md:col-span-2">
                <p className="text-gray-500">Sisa utang</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(detailDebt.remainingAmount)}</p>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      <PaySupplierDebtModal
        open={Boolean(payTarget)}
        debt={payTarget}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onClose={() => {
          if (!isSubmitting) {
            setPayTarget(null);
            setSubmitError(null);
          }
        }}
        onSubmit={handlePayDebt}
      />
    </ProtectedPageShell>
  );
}

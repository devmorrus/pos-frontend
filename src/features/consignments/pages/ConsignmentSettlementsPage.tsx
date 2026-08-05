import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { getErrorMessage } from "../../../utils/errors";
import ProcurementOutletSelector from "../../procurement/components/ProcurementOutletSelector";
import { useProcurementOutletScope } from "../../procurement/hooks/useProcurementOutletScope";
import { getSuppliers } from "../../suppliers/api/suppliersApi";
import type { SupplierDto } from "../../suppliers/types/supplier";
import {
  createConsignmentSettlement,
  getConsignmentSettlements,
  getUnpaidConsignmentSales,
} from "../api/consignmentsApi";
import type { ConsignmentSaleDto, ConsignmentSettlementDto } from "../types/consignment";
import {
  formatCurrency,
  formatDateTime,
  getSettlementStatusClasses,
} from "../utils/formatters";

export default function ConsignmentSettlementsPage() {
  const navigate = useNavigate();
  const { ownerMode, activeOutlets, effectiveOutletId, selectedOutletId, setSelectedOutletId } =
    useProcurementOutletScope();
  const [settlements, setSettlements] = useState<ConsignmentSettlementDto[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [unpaidSales, setUnpaidSales] = useState<ConsignmentSaleDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function loadBaseData() {
    if (!effectiveOutletId) {
      setSettlements([]);
      setSuppliers([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [settlementsResult, suppliersResult] = await Promise.all([
        getConsignmentSettlements(effectiveOutletId),
        getSuppliers(),
      ]);

      setSettlements(settlementsResult);
      setSuppliers(suppliersResult);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat settlement konsinyasi."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadBaseData();
  }, [effectiveOutletId]);

  useEffect(() => {
    async function loadPreview() {
      if (!effectiveOutletId || !selectedSupplierId) {
        setUnpaidSales([]);
        return;
      }

      setIsLoadingPreview(true);
      setSubmitError(null);

      try {
        setUnpaidSales(
          await getUnpaidConsignmentSales({
            supplierId: selectedSupplierId,
            outletId: effectiveOutletId,
          }),
        );
      } catch (requestError) {
        setSubmitError(getErrorMessage(requestError, "Gagal memuat preview penjualan konsinyasi."));
      } finally {
        setIsLoadingPreview(false);
      }
    }

    void loadPreview();
  }, [effectiveOutletId, selectedSupplierId]);

  const shouldShowOutletPrompt = ownerMode && !effectiveOutletId;

  const draftSalesTotal = useMemo(
    () => unpaidSales.reduce((total, sale) => total + sale.totalAmount, 0),
    [unpaidSales],
  );

  async function handleCreateSettlement() {
    if (!effectiveOutletId || !selectedSupplierId) {
      setSubmitError("Pilih supplier dan outlet terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createConsignmentSettlement({
        supplierId: selectedSupplierId,
        outletId: effectiveOutletId,
      });

      navigate(`/consignment-settlements/${result.id}`, {
        replace: true,
        state: { successMessage: `Settlement ${result.settlementNumber} berhasil dibuat.` },
      });
    } catch (requestError) {
      setSubmitError(getErrorMessage(requestError, "Gagal membuat settlement konsinyasi."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedPageShell
      title="Settlement Konsinyasi"
      description="Kelola pembayaran hak supplier berdasarkan penjualan barang titipan per outlet aktif."
    >
      <InlineAlert tone="error" message={error} />
      <InlineAlert tone="error" message={submitError} />

      <AppTableShell
        title="Draft settlement supplier"
        description="Pilih supplier untuk melihat penjualan konsinyasi yang masih unpaid lalu buat settlement baru."
        actions={
          <ProcurementOutletSelector
            ownerMode={ownerMode}
            value={selectedOutletId}
            onChange={setSelectedOutletId}
            outlets={activeOutlets}
          />
        }
      >
        {shouldShowOutletPrompt ? (
          <div className="p-6">
            <PagePlaceholder
              title="Pilih outlet konsinyasi terlebih dahulu"
              description="Owner perlu memilih outlet aktif sebelum melihat unpaid sales dan settlement supplier."
              status="Outlet required"
            />
          </div>
        ) : (
          <div className="grid gap-6 p-6 lg:grid-cols-[380px_minmax(0,1fr)]">
            <div className="space-y-4 rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Supplier</span>
                <select
                  value={selectedSupplierId}
                  onChange={(event) => setSelectedSupplierId(event.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                >
                  <option value="">Pilih supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-2xl border border-dashed border-gray-300 p-4 text-sm dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-300">Jumlah unpaid sales</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {unpaidSales.length}
                </p>
                <p className="mt-3 text-gray-600 dark:text-gray-300">Total hak supplier</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(draftSalesTotal)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void handleCreateSettlement()}
                disabled={!selectedSupplierId || unpaidSales.length === 0 || isSubmitting}
                className="w-full rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSubmitting ? "Membuat settlement..." : "Buat settlement"}
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
              {isLoadingPreview ? (
                <AppLoader label="Memuat unpaid sales..." />
              ) : unpaidSales.length === 0 ? (
                <PagePlaceholder
                  title="Belum ada unpaid sales"
                  description="Pilih supplier untuk memeriksa penjualan konsinyasi yang belum masuk settlement."
                  status={selectedSupplierId ? "No unpaid sales" : "Select supplier"}
                />
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-950">
                    <tr>
                      {["Transaksi", "Produk", "Qty", "Unit Cost", "Total", "Tanggal"].map((column) => (
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
                    {unpaidSales.map((sale) => (
                      <tr key={sale.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {sale.transactionNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                          {sale.productName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{sale.qty}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {formatCurrency(sale.unitCost)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(sale.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {formatDateTime(sale.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </AppTableShell>

      <AppTableShell
        title="Riwayat settlement konsinyasi"
        description={`Total settlement: ${settlements.length}`}
        actions={
          <>
            <Link
              to="/consignments"
              className="inline-flex items-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
            >
              Tanda Terima
            </Link>
            <Link
              to="/consignments/returns"
              className="inline-flex items-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
            >
              Retur
            </Link>
          </>
        }
      >
        {isLoading ? (
          <AppLoader label="Memuat daftar settlement..." />
        ) : settlements.length === 0 ? (
          <div className="p-6">
            <PagePlaceholder
              title="Belum ada settlement"
              description="Settlement supplier akan muncul setelah Anda membuat draft settlement dari unpaid sales."
              status="Empty"
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                {["No. Settlement", "Supplier", "Outlet", "Tanggal", "Total", "Status", "Aksi"].map((column) => (
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
              {settlements.map((settlement) => (
                <tr key={settlement.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {settlement.settlementNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                    {settlement.supplierName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {settlement.outletName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {formatDateTime(settlement.settlementDate)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(settlement.totalAmount)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getSettlementStatusClasses(
                        settlement.status,
                      )}`}
                    >
                      {settlement.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/consignment-settlements/${settlement.id}`}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AppTableShell>
    </ProtectedPageShell>
  );
}

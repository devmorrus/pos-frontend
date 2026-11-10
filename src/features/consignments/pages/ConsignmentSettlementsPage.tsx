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
import { DollarLineIcon } from "../../../icons";

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

      <section className="rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white p-6 dark:border-[#293b58] dark:from-[#172554] dark:via-[#1e1b4b] dark:to-[#111b2c] sm:p-8">
        <div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white"><DollarLineIcon className="h-7 w-7" aria-hidden="true" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Hak supplier</p><h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Settlement jelas, kemitraan terjaga</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">Periksa penjualan yang belum masuk settlement dan nilai hak supplier sebelum membuat dokumen penyelesaian.</p></div></div>
      </section>

      <AppTableShell
        title="Draft settlement supplier"
        description="Pilih supplier untuk memeriksa penjualan yang belum masuk settlement, lalu buat dokumen baru."
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
              description="Owner perlu memilih outlet aktif sebelum melihat penjualan dan settlement supplier."
              status="Outlet required"
            />
          </div>
        ) : (
          <div className="grid items-start gap-6 p-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-5 rounded-2xl border border-gray-200 bg-gray-50/60 p-5 dark:border-[#293b58] dark:bg-[#111b2c]">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Supplier</span>
                <select
                  value={selectedSupplierId}
                  onChange={(event) => setSelectedSupplierId(event.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white"
                >
                  <option value="">Pilih supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 text-sm dark:border-[#293b58] dark:bg-[#172554]">
                <p className="text-gray-600 dark:text-gray-300">Penjualan belum disettlement</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {unpaidSales.length}
                </p>
                <p className="mt-3 text-gray-600 dark:text-gray-300">Total hak supplier</p>
                <p className="mt-1 text-2xl font-bold text-brand-700 dark:text-brand-200">
                  {formatCurrency(draftSalesTotal)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void handleCreateSettlement()}
                disabled={!selectedSupplierId || unpaidSales.length === 0 || isSubmitting}
                className="min-h-12 w-full rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Membuat settlement..." : "Buat settlement"}
              </button>
            </div>

            <div className="min-w-0 overflow-x-auto rounded-2xl border border-gray-200 p-5 dark:border-[#293b58]">
              {isLoadingPreview ? (
                <AppLoader label="Memuat penjualan konsinyasi..." />
              ) : unpaidSales.length === 0 ? (
                <PagePlaceholder
                  title="Belum ada penjualan untuk settlement"
                  description="Pilih supplier untuk memeriksa penjualan konsinyasi yang belum masuk settlement."
                  status={selectedSupplierId ? "Tidak ada tagihan" : "Pilih supplier"}
                />
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-[#111b2c]">
                    <tr>
                      {["Transaksi", "Produk", "Jumlah", "Hak supplier/unit", "Total", "Tanggal"].map((column) => (
                        <th
                          key={column}
                          scope="col"
                          className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {unpaidSales.map((sale) => (
                      <tr key={sale.id} className="transition hover:bg-gray-50 dark:hover:bg-white/[0.02]">
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
              description="Riwayat akan muncul setelah Anda membuat draft settlement dari penjualan konsinyasi."
              status="Belum ada settlement"
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-[#111b2c]">
              <tr>
                {["No. Settlement", "Supplier", "Outlet", "Tanggal", "Total", "Status", "Aksi"].map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {settlements.map((settlement) => (
                <tr key={settlement.id} className="transition hover:bg-gray-50 dark:hover:bg-white/[0.02]">
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

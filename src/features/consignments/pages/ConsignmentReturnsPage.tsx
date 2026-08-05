import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import ProcurementOutletSelector from "../../procurement/components/ProcurementOutletSelector";
import { useProcurementOutletScope } from "../../procurement/hooks/useProcurementOutletScope";
import { getConsignmentReturns } from "../api/consignmentsApi";
import type { ConsignmentReturnDto } from "../types/consignment";
import { formatDateTime } from "../utils/formatters";

type ConsignmentReturnsLocationState = {
  successMessage?: string;
};

export function getConsignmentReturnStatusClasses(status: string) {
  if (status === "completed") {
    return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300";
  }
  if (status === "cancelled") {
    return "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-300";
  }
  return "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300";
}

export default function ConsignmentReturnsPage() {
  const location = useLocation();
  const { ownerMode, activeOutlets, effectiveOutletId, selectedOutletId, setSelectedOutletId } =
    useProcurementOutletScope();
  const [returns, setReturns] = useState<ConsignmentReturnDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage] = useState<string | null>(
    (location.state as ConsignmentReturnsLocationState | null)?.successMessage ?? null,
  );

  useEffect(() => {
    async function loadReturns() {
      if (!effectiveOutletId) {
        setReturns([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        setReturns(await getConsignmentReturns(effectiveOutletId));
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat daftar retur konsinyasi."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadReturns();
  }, [effectiveOutletId]);

  const shouldShowOutletPrompt = ownerMode && !effectiveOutletId;

  return (
    <ProtectedPageShell
      title="Retur Konsinyasi"
      description="Kelola pengembalian barang titipan konsinyasi yang tidak laku atau ditarik kembali oleh supplier."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      <AppTableShell
        title="Daftar retur konsinyasi"
        description={`Total dokumen retur: ${returns.length}`}
        actions={
          <>
            <ProcurementOutletSelector
              ownerMode={ownerMode}
              value={selectedOutletId}
              onChange={setSelectedOutletId}
              outlets={activeOutlets}
            />
            <Link
              to="/consignments"
              className="inline-flex items-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
            >
              Tanda Terima
            </Link>
            <Link
              to="/consignments/returns/create"
              className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Buat retur
            </Link>
          </>
        }
      >
        {isLoading ? (
          <AppLoader label="Memuat daftar retur konsinyasi..." />
        ) : shouldShowOutletPrompt ? (
          <div className="p-6">
            <PagePlaceholder
              title="Pilih outlet terlebih dahulu"
              description="Owner perlu memilih outlet aktif agar daftar retur konsinyasi memakai konteks yang benar."
              status="Outlet required"
            />
          </div>
        ) : returns.length === 0 ? (
          <div className="p-6">
            <PagePlaceholder
              title="Belum ada retur konsinyasi"
              description="Buat retur konsinyasi pertama jika ada barang titipan supplier yang ingin ditarik kembali."
              status="Empty"
            />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                {["No. Retur", "Supplier", "Outlet", "Tanggal", "Status", "Jumlah item", "Aksi"].map((column) => (
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
              {returns.map((ret) => (
                <tr key={ret.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {ret.returnNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                    {ret.supplierName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {ret.outletName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {formatDateTime(ret.returnDate)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getConsignmentReturnStatusClasses(
                        ret.status,
                      )}`}
                    >
                      {ret.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {ret.items.length}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/consignments/returns/${ret.id}`}
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

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, InlineAlert, PagePlaceholder } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import ProcurementOutletSelector from "../../procurement/components/ProcurementOutletSelector";
import { useProcurementOutletScope } from "../../procurement/hooks/useProcurementOutletScope";
import { getConsignments, getConsignmentReturns } from "../api/consignmentsApi";
import type { ConsignmentDto, ConsignmentReturnDto } from "../types/consignment";
import { formatDateTime, getConsignmentStatusClasses } from "../utils/formatters";
import { getConsignmentReturnStatusClasses } from "./ConsignmentReturnsPage";

type ConsignmentsLocationState = {
  successMessage?: string;
};

type TabKey = "ambil" | "returns";

export default function ConsignmentsPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { ownerMode, activeOutlets, effectiveOutletId, selectedOutletId, setSelectedOutletId } =
    useProcurementOutletScope();
  const [consignments, setConsignments] = useState<ConsignmentDto[]>([]);
  const [returns, setReturns] = useState<ConsignmentReturnDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage] = useState<string | null>(
    (location.state as ConsignmentsLocationState | null)?.successMessage ?? null,
  );

  const activeTab: TabKey = useMemo(() => {
    const raw = searchParams.get("tab");
    if (raw === "returns" || raw === "return") return "returns";
    return "ambil";
  }, [searchParams]);

  function setActiveTab(tab: TabKey) {
    const next = new URLSearchParams(searchParams);
    if (tab === "ambil") {
      next.delete("tab");
    } else {
      next.set("tab", "returns");
    }
    setSearchParams(next, { replace: true });
  }

  useEffect(() => {
    async function loadData() {
      if (!effectiveOutletId) {
        setConsignments([]);
        setReturns([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [consignmentsResult, returnsResult] = await Promise.all([
          getConsignments(effectiveOutletId),
          getConsignmentReturns(effectiveOutletId),
        ]);
        setConsignments(consignmentsResult);
        setReturns(returnsResult);
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat data konsinyasi."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [effectiveOutletId]);

  const shouldShowOutletPrompt = ownerMode && !effectiveOutletId;

  return (
    <ProtectedPageShell
      title="Konsinyasi"
      description="Kelola ambil dan return barang titipan supplier serta settlement hak supplier per outlet aktif dalam satu jalur."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <ProcurementOutletSelector
          ownerMode={ownerMode}
          value={selectedOutletId}
          onChange={setSelectedOutletId}
          outlets={activeOutlets}
        />
        <div className="ml-auto flex flex-wrap gap-2">
          <Link
            to="/consignment-settlements"
            className="inline-flex items-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
          >
            Settlement
          </Link>
          <Link
            to="/consignments/returns/create"
            className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          >
            Return Barang Konsinyasi
          </Link>
          <Link
            to="/consignments/create"
            className="inline-flex items-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm"
          >
            Ambil Barang Konsinyasi
          </Link>
        </div>
      </div>

      <div className="mb-6 inline-flex rounded-2xl bg-gray-100 p-1 dark:bg-gray-900">
        <button
          type="button"
          onClick={() => setActiveTab("ambil")}
          className={`rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${
            activeTab === "ambil"
              ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          Ambil Barang ({consignments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("returns")}
          className={`rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${
            activeTab === "returns"
              ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          Return Barang ({returns.length})
        </button>
      </div>

      {isLoading ? (
        <AppLoader label="Memuat data konsinyasi..." />
      ) : shouldShowOutletPrompt ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <PagePlaceholder
            title="Pilih outlet konsinyasi terlebih dahulu"
            description="Owner perlu memilih outlet aktif agar daftar tanda terima dan retur konsinyasi memakai konteks yang benar."
            status="Outlet required"
          />
        </div>
      ) : activeTab === "ambil" ? (
        <AppTableShell
          title="Daftar ambil barang konsinyasi"
          description={`Total tanda terima: ${consignments.length}`}
        >
          {consignments.length === 0 ? (
            <div className="p-6">
              <PagePlaceholder
                title="Belum ada tanda terima konsinyasi"
                description="Buat tanda terima pertama agar barang titipan supplier bisa diproses menjadi stok konsinyasi."
                status="Empty"
              />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-950">
                <tr>
                  {["No. Konsinyasi", "Supplier", "Outlet", "Tanggal", "Status", "Jumlah item", "Aksi"].map((column) => (
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
                {consignments.map((consignment) => (
                  <tr key={consignment.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {consignment.consignmentNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                      {consignment.supplierName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {consignment.outletName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {formatDateTime(consignment.receiveDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getConsignmentStatusClasses(
                          consignment.status,
                        )}`}
                      >
                        {consignment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {consignment.items.length}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/consignments/${consignment.id}`}
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
      ) : (
        <AppTableShell
          title="Daftar return konsinyasi"
          description={`Total dokumen retur: ${returns.length}`}
        >
          {returns.length === 0 ? (
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
      )}
    </ProtectedPageShell>
  );
}

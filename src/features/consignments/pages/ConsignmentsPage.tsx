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
import { BoxCubeIcon, DollarLineIcon, PlusIcon } from "../../../icons";

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
      description="Kelola penerimaan, retur barang titipan, dan penyelesaian hak supplier per outlet."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      <section className="rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white p-6 dark:border-[#293b58] dark:from-[#172554] dark:via-[#1e1b4b] dark:to-[#111b2c] sm:p-8">
        <div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/20"><BoxCubeIcon className="h-7 w-7" aria-hidden="true" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Barang titipan supplier</p><h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Titipan tercatat, kerja sama terjaga</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">Pantau tanda terima dan pengembalian barang, lalu kelola settlement berdasarkan penjualan konsinyasi.</p></div></div>
      </section>

      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <ProcurementOutletSelector
          ownerMode={ownerMode}
          value={selectedOutletId}
          onChange={setSelectedOutletId}
          outlets={activeOutlets}
        />
        <div className="ml-auto flex flex-wrap gap-2">
          <Link
            to="/consignment-settlements"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
          >
            <DollarLineIcon className="h-5 w-5" aria-hidden="true" />Settlement
          </Link>
          <Link
            to="/consignments/returns/create"
            className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          >
            Retur barang
          </Link>
          <Link
            to="/consignments/create"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" />Ambil barang konsinyasi
          </Link>
        </div>
      </div>

      <div role="group" aria-label="Jenis dokumen konsinyasi" className="inline-flex max-w-full flex-wrap gap-1 rounded-2xl border border-gray-200 bg-gray-100 p-1 dark:border-[#293b58] dark:bg-[#111b2c]">
        <button
          type="button"
          aria-pressed={activeTab === "ambil"}
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
          aria-pressed={activeTab === "returns"}
          onClick={() => setActiveTab("returns")}
          className={`rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${
            activeTab === "returns"
              ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
              : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          Retur Barang ({returns.length})
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
                status="Mulai di sini"
              />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-[#111b2c]">
                <tr>
                  {["No. Konsinyasi", "Supplier", "Outlet", "Tanggal", "Status", "Jumlah item", "Aksi"].map((column) => (
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
                {consignments.map((consignment) => (
                  <tr key={consignment.id} className="transition hover:bg-gray-50 dark:hover:bg-white/[0.02]">
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
          title="Daftar retur konsinyasi"
          description={`Total dokumen retur: ${returns.length}`}
        >
          {returns.length === 0 ? (
            <div className="p-6">
              <PagePlaceholder
                title="Belum ada retur konsinyasi"
                description="Buat retur konsinyasi pertama jika ada barang titipan supplier yang ingin ditarik kembali."
                status="Belum ada retur"
              />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-[#111b2c]">
                <tr>
                  {["No. Retur", "Supplier", "Outlet", "Tanggal", "Status", "Jumlah item", "Aksi"].map((column) => (
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
                {returns.map((ret) => (
                  <tr key={ret.id} className="transition hover:bg-gray-50 dark:hover:bg-white/[0.02]">
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

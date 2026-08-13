import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppLoader, InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { getCashFlowById } from "../api/cashFlowsApi";
import type { CashFlowDetailDto } from "../types/cashFlow";
import {
  formatCashFlowCurrency,
  formatCashFlowDate,
  formatCashFlowDateTime,
  getCashFlowTypeLabel,
} from "../utils/presentation";

type CashFlowDetailLocationState = {
  successMessage?: string;
};

export default function CashFlowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [item, setItem] = useState<CashFlowDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage] = useState<string | null>(
    (location.state as CashFlowDetailLocationState | null)?.successMessage ?? null,
  );

  useEffect(() => {
    async function loadDetail() {
      if (!id) {
        setError("Transaksi cash flow tidak valid.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        setItem(await getCashFlowById(id));
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat detail transaksi cash flow."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadDetail();
  }, [id]);

  const backPath = useMemo(() => {
    if (item?.trxType === "out") {
      return "/outcome-businesses";
    }

    if (location.pathname.startsWith("/outcome-businesses")) {
      return "/outcome-businesses";
    }

    return "/income-businesses";
  }, [item?.trxType, location.pathname]);

  return (
    <ProtectedPageShell
      title="Detail Cash Flow"
      description="Tinjau transaksi manual, pasangan akun, lampiran, dan jurnal yang terbentuk otomatis."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      {isLoading ? (
        <AppLoader label="Memuat detail cash flow..." />
      ) : !item ? null : (
        <div className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">No. transaksi</p>
                  <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">{item.trxNumber}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Tipe</p>
                  <p className="mt-2 text-base text-gray-700 dark:text-gray-200">{getCashFlowTypeLabel(item.trxType)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Tanggal transaksi</p>
                  <p className="mt-2 text-base text-gray-700 dark:text-gray-200">{formatCashFlowDate(item.trxDate)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Outlet</p>
                  <p className="mt-2 text-base text-gray-700 dark:text-gray-200">{item.outletName ?? "Business"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Nominal</p>
                  <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                    {formatCashFlowCurrency(item.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Dibuat</p>
                  <p className="mt-2 text-base text-gray-700 dark:text-gray-200">
                    {item.createdByName} • {formatCashFlowDateTime(item.createdAt)}
                  </p>
                </div>
              </div>

              <Link
                to={backPath}
                className="inline-flex items-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
              >
                Kembali ke daftar
              </Link>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-5 dark:bg-gray-950">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Akun asal</p>
                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                  {item.fromChartOfAccountCode} - {item.fromChartOfAccountName}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-5 dark:bg-gray-950">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Akun tujuan</p>
                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                  {item.toChartOfAccountCode} - {item.toChartOfAccountName}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Catatan</p>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">{item.note || "-"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Lampiran</p>
                {item.attachmentUrl ? (
                  <a
                    href={item.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-500"
                  >
                    Buka lampiran
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">Tidak ada lampiran</p>
                )}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Jurnal otomatis</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Setiap transaksi cash flow langsung membentuk dua baris jurnal yang seimbang.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-950">
                  <tr>
                    {["Kode", "Nama akun", "Debit", "Kredit"].map((column) => (
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
                  {item.journalEntries.map((entry) => (
                    <tr key={entry.accountTransactionId}>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{entry.accountCode}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{entry.accountName}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                        {entry.debitAmount > 0 ? formatCashFlowCurrency(entry.debitAmount) : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                        {entry.creditAmount > 0 ? formatCashFlowCurrency(entry.creditAmount) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </ProtectedPageShell>
  );
}

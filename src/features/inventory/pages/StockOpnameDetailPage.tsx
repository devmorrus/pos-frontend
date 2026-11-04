import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router";
import ProtectedPageShell from "../../../components/layout/ProtectedPageShell";
import { AppTableShell } from "../../../components/tables";
import { AppLoader, InlineAlert } from "../../../components/ui";
import { getErrorMessage } from "../../../utils/errors";
import { getStockOpnameById } from "../api/inventoryApi";
import type { StockOpnameDto } from "../types/inventory";
import { formatDateTime, formatQuantity } from "../utils/presentation";

type StockOpnameLocationState = {
  successMessage?: string;
};

export default function StockOpnameDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [item, setItem] = useState<StockOpnameDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage] = useState<string | null>(
    (location.state as StockOpnameLocationState | null)?.successMessage ?? null,
  );

  useEffect(() => {
    async function loadDetail() {
      if (!id) {
        setError("ID stock opname tidak valid.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        setItem(await getStockOpnameById(id));
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Gagal memuat detail stock opname."));
      } finally {
        setIsLoading(false);
      }
    }

    void loadDetail();
  }, [id]);

  return (
    <ProtectedPageShell
      title="Detail Stock Opname"
      description="Tinjau hasil stock opname yang sudah completed beserta variance tiap item."
    >
      <InlineAlert tone="success" message={successMessage} />
      <InlineAlert tone="error" message={error} />

      {isLoading ? (
        <AppLoader label="Memuat detail stock opname..." />
      ) : !item ? null : (
        <>
          <section className="grid gap-6 lg:grid-cols-4">
            {[
              ["Outlet", item.outletName],
              ["Performed by", item.performedByName],
              ["Status", item.status],
              ["Waktu", formatDateTime(item.createdAt)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-3xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{label}</p>
                <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">{value}</p>
              </div>
            ))}
          </section>

          <AppTableShell
            title="Item variance"
            description={`Total item: ${item.items.length}`}
          >
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-950">
                <tr>
                  {["SKU", "Produk", "Batch / Serial", "System qty", "Physical qty", "Variance"].map((column) => (
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
                {item.items.map((row, index) => (
                  <tr key={`${row.productId}-${row.productBatchId ?? row.productSerialId ?? index}`}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{row.sku}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">{row.productName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{row.batchNumber ?? row.serialNumber ?? "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{formatQuantity(row.systemQty)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{formatQuantity(row.physicalQty)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{formatQuantity(row.variance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AppTableShell>
        </>
      )}
    </ProtectedPageShell>
  );
}

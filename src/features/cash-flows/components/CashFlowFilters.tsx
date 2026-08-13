import type { OutletDto } from "../../outlets/types/outlet";
import type { ChartOfAccountDto } from "../../accounting/types/chartOfAccount";
import type { CashFlowFilterValues } from "../types/cashFlow";

type CashFlowFiltersProps = {
  filters: CashFlowFilterValues;
  accounts: ChartOfAccountDto[];
  outlets: OutletDto[];
  canFilterOutlet: boolean;
  onChange: (next: CashFlowFilterValues) => void;
};

export default function CashFlowFilters({
  filters,
  accounts,
  outlets,
  canFilterOutlet,
  onChange,
}: CashFlowFiltersProps) {
  return (
    <div className="grid gap-3 border-b border-gray-200 p-4 dark:border-gray-800 md:grid-cols-5">
      <input
        value={filters.keyword ?? ""}
        onChange={(event) => onChange({ ...filters, keyword: event.target.value })}
        placeholder="Cari nomor, catatan, atau akun"
        className="h-11 rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
      />

      <input
        type="date"
        value={filters.dateFrom ?? ""}
        onChange={(event) => onChange({ ...filters, dateFrom: event.target.value })}
        className="h-11 rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
      />

      <input
        type="date"
        value={filters.dateTo ?? ""}
        onChange={(event) => onChange({ ...filters, dateTo: event.target.value })}
        className="h-11 rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
      />

      <select
        value={filters.chartOfAccountId ?? ""}
        onChange={(event) => onChange({ ...filters, chartOfAccountId: event.target.value || undefined })}
        className="h-11 rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
      >
        <option value="">Semua akun</option>
        {accounts
          .filter((account) => account.isActive)
          .sort((left, right) => left.accountCode.localeCompare(right.accountCode, "id-ID"))
          .map((account) => (
            <option key={account.id} value={account.id}>
              {account.accountCode} - {account.accountName}
            </option>
          ))}
      </select>

      {canFilterOutlet ? (
        <select
          value={filters.outletId ?? ""}
          onChange={(event) => onChange({ ...filters, outletId: event.target.value || undefined })}
          className="h-11 rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
        >
          <option value="">Semua outlet</option>
          {outlets
            .filter((outlet) => outlet.isActive)
            .sort((left, right) => left.name.localeCompare(right.name, "id-ID"))
            .map((outlet) => (
              <option key={outlet.id} value={outlet.id}>
                {outlet.name}
              </option>
            ))}
        </select>
      ) : (
        <div />
      )}
    </div>
  );
}

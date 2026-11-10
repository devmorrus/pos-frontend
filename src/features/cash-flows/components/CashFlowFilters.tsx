import type { OutletDto } from "../../outlets/types/outlet";
import type { ChartOfAccountDto } from "../../accounting/types/chartOfAccount";
import type { CashFlowFilterValues } from "../types/cashFlow";

const inputClassName = "mt-2 h-12 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-4 text-sm font-normal text-gray-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white dark:[color-scheme:dark]";

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
    <div className="grid gap-4 border-b border-gray-200 bg-gray-50/50 p-5 dark:border-gray-800 dark:bg-[#111b2c] sm:grid-cols-2 xl:grid-cols-5">
      <label className="min-w-0 text-xs font-semibold text-gray-600 dark:text-gray-300">Cari transaksi
      <input
        value={filters.keyword ?? ""}
        onChange={(event) => onChange({ ...filters, keyword: event.target.value })}
        placeholder="Cari nomor, catatan, atau akun"
        className={inputClassName}
      />
      </label>
      <label className="min-w-0 text-xs font-semibold text-gray-600 dark:text-gray-300">Dari tanggal
      <input
        type="date"
        value={filters.dateFrom ?? ""}
        onChange={(event) => onChange({ ...filters, dateFrom: event.target.value })}
        className={inputClassName}
      />
      </label>
      <label className="min-w-0 text-xs font-semibold text-gray-600 dark:text-gray-300">Sampai tanggal
      <input
        type="date"
        value={filters.dateTo ?? ""}
        onChange={(event) => onChange({ ...filters, dateTo: event.target.value })}
        className={inputClassName}
      />
      </label>
      <label className="min-w-0 text-xs font-semibold text-gray-600 dark:text-gray-300">Akun keuangan
      <select
        value={filters.chartOfAccountId ?? ""}
        onChange={(event) => onChange({ ...filters, chartOfAccountId: event.target.value || undefined })}
        className={inputClassName}
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
      </label>
      {canFilterOutlet ? (
        <label className="min-w-0 text-xs font-semibold text-gray-600 dark:text-gray-300">Outlet
        <select
          value={filters.outletId ?? ""}
          onChange={(event) => onChange({ ...filters, outletId: event.target.value || undefined })}
          className={inputClassName}
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
        </label>
      ) : null}
    </div>
  );
}

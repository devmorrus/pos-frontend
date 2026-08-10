import { formatCurrency, formatDateOnly, formatDateTime } from "../../procurement/utils/formatters";

export { formatCurrency, formatDateOnly, formatDateTime };

export function getChannelSettlementStatusClasses(status: string) {
  switch (status) {
    case "settled":
      return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300";
    case "cancelled":
      return "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-300";
    default:
      return "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300";
  }
}

export function getChannelAccountStatusClasses(isActive: boolean) {
  return isActive
    ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300"
    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
}

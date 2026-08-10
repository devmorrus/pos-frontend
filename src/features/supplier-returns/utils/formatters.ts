import { formatCurrency, formatDateOnly, formatDateTime } from "../../procurement/utils/formatters";

export { formatCurrency, formatDateOnly, formatDateTime };

export function getSupplierReturnStatusClasses(status: string) {
  switch (status) {
    case "completed":
      return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300";
    case "sent":
      return "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}

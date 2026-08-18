export function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("id-ID");
}

export function formatDateOnly(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("id-ID");
}

export function getPoStatusClasses(status: string) {
  switch (status) {
    case "completed":
      return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300";
    case "pending":
    case "partially_received":
      return "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300";
    case "cancelled":
      return "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}

export function getDebtStatusClasses(status: string) {
  switch (status) {
    case "paid":
      return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300";
    case "partially_paid":
      return "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300";
    default:
      return "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-300";
  }
}

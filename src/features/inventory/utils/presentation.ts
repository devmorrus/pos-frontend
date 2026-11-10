export function formatQuantity(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID");
}

export function getInventoryStatus(
  qtyOnHand: number,
  minStockAlert: number,
  isLowStock: boolean,
) {
  if (qtyOnHand <= 0) {
    return "Habis";
  }

  if (isLowStock || qtyOnHand <= minStockAlert) {
    return "Rendah";
  }

  return "Aman";
}

export function getInventoryStatusTone(
  qtyOnHand: number,
  minStockAlert: number,
  isLowStock: boolean,
) {
  if (qtyOnHand <= 0) {
    return "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-300";
  }

  if (isLowStock || qtyOnHand <= minStockAlert) {
    return "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300";
  }

  return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300";
}

export function getTransferStatusBucket(
  status: string,
): "pending" | "approved" | "rejected" {
  const normalized = status.toLowerCase();

  if (normalized === "approved") {
    return "approved";
  }

  if (normalized === "rejected" || normalized === "cancelled") {
    return "rejected";
  }

  return "pending";
}

export function getTransferStatusLabel(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "approved") {
    return "Disetujui";
  }

  if (normalized === "rejected") {
    return "Ditolak";
  }

  if (normalized === "cancelled") {
    return "Dibatalkan";
  }

  if (normalized === "pending") {
    return "Menunggu";
  }

  return status;
}

export function getTransferStatusTone(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "approved") {
    return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300";
  }

  if (normalized === "rejected" || normalized === "cancelled") {
    return "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-300";
  }

  return "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300";
}

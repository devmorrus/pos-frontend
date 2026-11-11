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

  if (normalized === "approved" || normalized === "received") {
    return "approved";
  }

  if (["rejected", "cancelled", "returned", "received_with_variance"].includes(normalized)) {
    return "rejected";
  }

  return "pending";
}

export function getTransferStatusLabel(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "approved" || normalized === "received") {
    return "Diterima";
  }

  if (normalized === "rejected") {
    return "Ditolak";
  }

  if (normalized === "returned") return "Dikembalikan";
  if (normalized === "received_with_variance") return "Diterima dengan selisih";

  if (normalized === "cancelled") {
    return "Dibatalkan";
  }

  if (normalized === "pending" || normalized === "in_transit") {
    return "Dalam perjalanan";
  }

  return status;
}

export function getTransferStatusTone(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "approved" || normalized === "received") {
    return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300";
  }

  if (["rejected", "cancelled", "returned"].includes(normalized)) {
    return "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-300";
  }

  return "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300";
}

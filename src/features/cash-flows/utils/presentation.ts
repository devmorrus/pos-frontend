export function formatCashFlowCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCashFlowDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID");
}

export function formatCashFlowDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID");
}

export function getCashFlowTypeLabel(trxType: "in" | "out") {
  return trxType === "in" ? "Pendapatan" : "Pengeluaran";
}

import { apiClient } from "../../../api/client";
import type {
  AccountingCashFlowReportDto,
  AccountingCashFlowReportFilters,
  AccountingProfitLossReportDto,
  AccountingProfitLossReportFilters,
  PurchaseRecapReportDto,
  SalesRecapReportDto,
} from "../types/reports";

export function getCashFlowReport(params: AccountingCashFlowReportFilters) {
  const query = new URLSearchParams();
  if (params.outletId) query.append("outletId", params.outletId);
  if (params.chartOfAccountId) query.append("chartOfAccountId", params.chartOfAccountId);
  if (params.keyword) query.append("keyword", params.keyword);
  if (params.dateFrom) query.append("dateFrom", params.dateFrom);
  if (params.dateTo) query.append("dateTo", params.dateTo);

  return apiClient.get<AccountingCashFlowReportDto>(`/api/reports/cash-flow?${query.toString()}`);
}

export async function exportCashFlowExcel(params: AccountingCashFlowReportFilters) {
  const query = new URLSearchParams();
  if (params.outletId) query.append("outletId", params.outletId);
  if (params.chartOfAccountId) query.append("chartOfAccountId", params.chartOfAccountId);
  if (params.keyword) query.append("keyword", params.keyword);
  if (params.dateFrom) query.append("dateFrom", params.dateFrom);
  if (params.dateTo) query.append("dateTo", params.dateTo);

  return apiClient.get<Blob>(`/api/reports/cash-flow/export-excel?${query.toString()}`, {
    responseType: "blob",
  });
}

export function getProfitLossReport(params: AccountingProfitLossReportFilters) {
  const query = new URLSearchParams();
  if (params.outletId) query.append("outletId", params.outletId);
  if (params.keyword) query.append("keyword", params.keyword);
  if (params.dateFrom) query.append("dateFrom", params.dateFrom);
  if (params.dateTo) query.append("dateTo", params.dateTo);

  return apiClient.get<AccountingProfitLossReportDto>(`/api/reports/profit-loss?${query.toString()}`);
}

export async function exportProfitLossExcel(params: AccountingProfitLossReportFilters) {
  const query = new URLSearchParams();
  if (params.outletId) query.append("outletId", params.outletId);
  if (params.keyword) query.append("keyword", params.keyword);
  if (params.dateFrom) query.append("dateFrom", params.dateFrom);
  if (params.dateTo) query.append("dateTo", params.dateTo);

  return apiClient.get<Blob>(`/api/reports/profit-loss/export-excel?${query.toString()}`, {
    responseType: "blob",
  });
}

export function getPurchaseRecapReport(params: {
  outletId?: string;
  startDate: string;
  endDate: string;
}) {
  const query = new URLSearchParams();
  if (params.outletId) {
    query.append("outletId", params.outletId);
  }
  query.append("startDate", params.startDate);
  query.append("endDate", params.endDate);

  return apiClient.get<PurchaseRecapReportDto>(`/api/reports/purchases?${query.toString()}`);
}

export async function exportPurchaseRecapExcel(params: {
  outletId?: string;
  startDate: string;
  endDate: string;
}) {
  const query = new URLSearchParams();
  if (params.outletId) {
    query.append("outletId", params.outletId);
  }
  query.append("startDate", params.startDate);
  query.append("endDate", params.endDate);

  const csvText = await apiClient.get<string>(`/api/reports/purchases/export-excel?${query.toString()}`);
  
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  
  const formattedStart = params.startDate.replace(/-/g, "");
  const formattedEnd = params.endDate.replace(/-/g, "");
  link.setAttribute("download", `Rekap_Pembelian_${formattedStart}_${formattedEnd}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function getSalesRecapReport(params: {
  outletId?: string;
  startDate: string;
  endDate: string;
}) {
  const query = new URLSearchParams();
  if (params.outletId) {
    query.append("outletId", params.outletId);
  }
  query.append("startDate", params.startDate);
  query.append("endDate", params.endDate);

  return apiClient.get<SalesRecapReportDto>(`/api/reports/sales?${query.toString()}`);
}

export async function exportSalesRecapExcel(params: {
  outletId?: string;
  startDate: string;
  endDate: string;
}) {
  const query = new URLSearchParams();
  if (params.outletId) {
    query.append("outletId", params.outletId);
  }
  query.append("startDate", params.startDate);
  query.append("endDate", params.endDate);

  const csvText = await apiClient.get<string>(`/api/reports/sales/export-excel?${query.toString()}`);
  
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  
  const formattedStart = params.startDate.replace(/-/g, "");
  const formattedEnd = params.endDate.replace(/-/g, "");
  link.setAttribute("download", `Rekap_Penjualan_${formattedStart}_${formattedEnd}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

import { apiClient } from "../../../api/client";
import type {
  CustomerDto,
  CustomerListItemDto,
  CustomerTransactionsResponse,
} from "../types/customer";

type CustomerQuery = {
  q?: string;
  isMember?: boolean;
  isActive?: boolean;
  dateFrom?: string;
  dateTo?: string;
  take?: number;
};

type CustomerPayload = {
  name: string;
  phone: string;
  email?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  notes?: string | null;
  isActive: boolean;
  creditLimit?: number;
  ktpNumber?: string | null;
  address?: string | null;
};

function buildQuery(params: Record<string, string>) {
  return new URLSearchParams(params).toString();
}

export function getCustomers(query: CustomerQuery = {}) {
  const params: Record<string, string> = {};

  if (query.q) params.q = query.q;
  if (typeof query.isMember === "boolean") params.isMember = String(query.isMember);
  if (typeof query.isActive === "boolean") params.isActive = String(query.isActive);
  if (query.dateFrom) params.dateFrom = query.dateFrom;
  if (query.dateTo) params.dateTo = query.dateTo;
  if (query.take) params.take = String(query.take);

  const qs = buildQuery(params);
  return apiClient.get<CustomerListItemDto[]>(`/api/customers${qs ? `?${qs}` : ""}`);
}

export function lookupCustomers(q: string, take = 10) {
  const qs = buildQuery({ q, take: String(take) });
  return apiClient.get<CustomerListItemDto[]>(`/api/customers/lookup?${qs}`);
}

export function getCustomerById(id: string) {
  return apiClient.get<CustomerDto>(`/api/customers/${id}`);
}

export function createCustomer(payload: CustomerPayload) {
  return apiClient.post<CustomerDto>("/api/customers", payload);
}

export function updateCustomer(id: string, payload: CustomerPayload) {
  return apiClient.put<CustomerDto>(`/api/customers/${id}`, payload);
}

export function getCustomerTransactions(id: string, take = 20) {
  return apiClient.get<CustomerTransactionsResponse>(`/api/customers/${id}/transactions?take=${take}`);
}

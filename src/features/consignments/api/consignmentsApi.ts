import { apiClient } from "../../../api/client";
import type {
  ConsignmentDto,
  ConsignmentSaleDto,
  ConsignmentSettlementDto,
  CreateConsignmentRequest,
  CreateConsignmentSettlementRequest,
  UpdateConsignmentSettlementStatusRequest,
  UpdateConsignmentStatusRequest,
  ConsignmentReturnDto,
  CreateConsignmentReturnRequest,
  UpdateConsignmentReturnStatusRequest,
} from "../types/consignment";

export function getConsignments(outletId: string) {
  const params = new URLSearchParams({ outletId });
  return apiClient.get<ConsignmentDto[]>(`/api/consignments?${params.toString()}`);
}

export function getConsignmentById(id: string) {
  return apiClient.get<ConsignmentDto>(`/api/consignments/${id}`);
}

export function createConsignment(payload: CreateConsignmentRequest) {
  return apiClient.post<ConsignmentDto>("/api/consignments", payload);
}

export function updateConsignmentStatus(id: string, payload: UpdateConsignmentStatusRequest) {
  return apiClient.put<ConsignmentDto>(`/api/consignments/${id}/status`, payload);
}

export function getConsignmentSettlements(outletId: string) {
  const params = new URLSearchParams({ outletId });
  return apiClient.get<ConsignmentSettlementDto[]>(`/api/consignmentsettlements?${params.toString()}`);
}

export function getConsignmentSettlementById(id: string) {
  return apiClient.get<ConsignmentSettlementDto>(`/api/consignmentsettlements/${id}`);
}

export function getUnpaidConsignmentSales(params: { supplierId: string; outletId: string }) {
  const search = new URLSearchParams(params);
  return apiClient.get<ConsignmentSaleDto[]>(
    `/api/consignmentsettlements/unpaid-sales?${search.toString()}`,
  );
}

export function createConsignmentSettlement(payload: CreateConsignmentSettlementRequest) {
  return apiClient.post<ConsignmentSettlementDto>("/api/consignmentsettlements", payload);
}

export function updateConsignmentSettlementStatus(
  id: string,
  payload: UpdateConsignmentSettlementStatusRequest,
) {
  return apiClient.put<ConsignmentSettlementDto>(
    `/api/consignmentsettlements/${id}/status`,
    payload,
  );
}

export function getConsignmentReturns(outletId: string) {
  const params = new URLSearchParams({ outletId });
  return apiClient.get<ConsignmentReturnDto[]>(`/api/consignments/returns?${params.toString()}`);
}

export function getConsignmentReturnById(id: string) {
  return apiClient.get<ConsignmentReturnDto>(`/api/consignments/returns/${id}`);
}

export function createConsignmentReturn(payload: CreateConsignmentReturnRequest) {
  return apiClient.post<ConsignmentReturnDto>("/api/consignments/returns", payload);
}

export function updateConsignmentReturnStatus(id: string, payload: UpdateConsignmentReturnStatusRequest) {
  return apiClient.put<ConsignmentReturnDto>(`/api/consignments/returns/${id}/status`, payload);
}

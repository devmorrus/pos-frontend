import { apiClient } from "../../../api/client";
import type {
  AccountingBackfillRequest,
  AccountingBackfillResultDto,
  AccountingPostingStatusDto,
  AccountingReferenceType,
} from "../types/accountingIntegration";

export async function getAccountingPostingStatus(
  referenceType: AccountingReferenceType,
  referenceId: string,
): Promise<AccountingPostingStatusDto> {
  return apiClient.get<AccountingPostingStatusDto>(
    `/api/accounting-integrations/status/${referenceType}/${referenceId}`,
  );
}

export async function runAccountingBackfill(
  payload: AccountingBackfillRequest,
): Promise<AccountingBackfillResultDto> {
  return apiClient.post<AccountingBackfillResultDto>("/api/accounting-integrations/backfill", payload);
}

export type CashFlowType = "in" | "out";

export type CashFlowFilterValues = {
  keyword?: string;
  dateFrom?: string;
  dateTo?: string;
  outletId?: string;
  chartOfAccountId?: string;
};

export type CashFlowListItemDto = {
  id: string;
  trxNumber: string;
  trxDate: string;
  trxType: CashFlowType;
  trxEntity: string;
  amount: number;
  fromChartOfAccountId: string;
  fromChartOfAccountCode: string;
  fromChartOfAccountName: string;
  toChartOfAccountId: string;
  toChartOfAccountCode: string;
  toChartOfAccountName: string;
  outletId: string | null;
  outletName: string | null;
  note: string | null;
  attachmentUrl: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: string;
};

export type CashFlowJournalEntryDto = {
  accountTransactionId: string;
  chartOfAccountId: string;
  accountCode: string;
  accountName: string;
  debitAmount: number;
  creditAmount: number;
};

export type CashFlowDetailDto = CashFlowListItemDto & {
  journalEntries: CashFlowJournalEntryDto[];
};

export type CreateBusinessCashFlowRequest = {
  trxDate: string;
  outletId: string | null;
  fromChartOfAccountId: string;
  toChartOfAccountId: string;
  amount: number;
  note: string | null;
  attachmentUrl: string | null;
};

export type CashFlowFormValues = {
  trxDate: string;
  outletId: string;
  fromChartOfAccountId: string;
  toChartOfAccountId: string;
  amount: string;
  note: string;
  attachmentUrl: string;
};

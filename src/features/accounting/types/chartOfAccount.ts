export type ChartOfAccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "cogs"
  | "expense";

export type ChartOfAccountScope = "business" | "outlet";

export type ChartOfAccountDto = {
  id: string;
  businessId: string;
  accountCode: string;
  accountName: string;
  accountType: ChartOfAccountType;
  isCashBank: boolean;
  isActive: boolean;
  outletId: string | null;
  outletName: string | null;
  parentAccountId: string | null;
  parentAccountName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateChartOfAccountRequest = {
  accountCode: string;
  accountName: string;
  accountType: ChartOfAccountType;
  isCashBank: boolean;
  outletId: string | null;
  parentAccountId: string | null;
};

export type UpdateChartOfAccountRequest = CreateChartOfAccountRequest & {
  isActive: boolean;
};

export type UpdateChartOfAccountStatusRequest = {
  isActive: boolean;
};

export type ChartOfAccountFormValues = {
  accountCode: string;
  accountName: string;
  accountType: ChartOfAccountType | "";
  scope: ChartOfAccountScope;
  outletId: string;
  parentAccountId: string;
  isCashBank: boolean;
  isActive: boolean;
};

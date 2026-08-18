export type CashierSessionDto = {
  id: string;
  outletId: string;
  outletName: string;
  userId: string;
  userName: string;
  openingTime: string;
  closingTime: string | null;
  openingCash: number;
  expectedCash: number;
  actualCash: number | null;
  variance: number | null;
  status: string;
  totalCashReceived: number;
  totalPettyCashExpenses: number;
  paymentsSummary: Record<string, number>;
};

export type OpenSessionRequest = {
  openingCash: number;
  outletId?: string | null;
};

export type CloseSessionRequest = {
  actualCash: number;
};

export type PettyCashExpenseDto = {
  id: string;
  outletId: string;
  outletName: string;
  cashierSessionId: string;
  amount: number;
  description: string;
  category: string;
  processedBy: string;
  processedByName: string;
  createdAt: string;
};

export type CreatePettyCashRequest = {
  amount: number;
  description: string;
  category: string;
};

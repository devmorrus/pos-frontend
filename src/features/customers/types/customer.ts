import type { TransactionListItemDto } from "../../transactions/types/transaction";

export type CustomerListItemDto = {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  email: string | null;
  isMember: boolean;
  memberStatus: string;
  isActive: boolean;
  lifetimeSpend: number;
  lastTransactionAt: string | null;
  createdAt: string;
};

export type CustomerDto = {
  id: string;
  businessId: string | null;
  createdOutletId: string | null;
  customerCode: string;
  name: string;
  phone: string;
  email: string | null;
  gender: string | null;
  birthDate: string | null;
  notes: string | null;
  isActive: boolean;
  isMember: boolean;
  memberStatus: string;
  pointsBalance: number;
  lifetimeSpend: number;
  joinedAt: string | null;
  lastTransactionAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerFormValues = {
  name: string;
  phone: string;
  email: string;
  gender: string;
  birthDate: string;
  notes: string;
  isActive: boolean;
};

export type CustomerTransactionsResponse = TransactionListItemDto[];

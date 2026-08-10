export type ChannelAccountDto = {
  id: string;
  outletId: string;
  outletName: string;
  name: string;
  channelName: string;
  merchantId: string;
  defaultCommissionRate: number;
  isActive: boolean;
};

export type CreateChannelAccountRequest = {
  outletId: string;
  name: string;
  channelName: string;
  merchantId: string | null;
  defaultCommissionRate: number;
  isActive: boolean;
};

export type UpdateChannelAccountRequest = CreateChannelAccountRequest;

export type ChannelSettlementEligibleTransactionDto = {
  transactionId: string;
  transactionNumber: string;
  outletId: string;
  outletName: string;
  createdAt: string;
  grandTotal: number;
  channel: string;
  cashierName: string;
};

export type ChannelSettlementItemDto = {
  transactionId: string;
  transactionNumber: string;
  transactionDate: string;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
};

export type ChannelSettlementListItemDto = {
  id: string;
  settlementNumber: string;
  channelAccountId: string;
  channelAccountName: string;
  outletId: string;
  outletName: string;
  settlementDate: string;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  status: string;
};

export type ChannelSettlementDto = ChannelSettlementListItemDto & {
  channelName: string;
  periodStartDate: string;
  periodEndDate: string;
  commissionRate: number;
  createdBy: string;
  createdByName: string;
  items: ChannelSettlementItemDto[];
};

export type CreateChannelSettlementRequest = {
  channelAccountId: string;
  periodStartDate: string;
  periodEndDate: string;
  commissionAmountOverride: number | null;
  transactionIds: string[];
};

export type UpdateChannelSettlementRequest = CreateChannelSettlementRequest;

export type UpdateChannelSettlementStatusRequest = {
  status: string;
};

export type ChannelSettlementFilters = {
  outletId?: string | null;
  channelAccountId?: string;
  status?: string;
};

export type SearchUserResult = {
  user_id: string;
  email: string;
  display_name: string;
};

export type SearchTradingAccountResult = {
  account_id: string;
  account_number: string;
  user_id: string;
  display_name: string;
};

export type SearchCommissionBatchResult = {
  batch_id: string;
  broker: string;
  status: string;
};

export type SearchWithdrawalResult = {
  withdrawal_id: string;
  user_id: string;
  beneficiary: string;
  account_id: string | null;
  amount: number;
  status: string;
};

export type SearchBrokerResult = {
  broker_id: string;
  broker_name: string;
  status: string;
};

export type SearchCampaignResult = {
  campaign_id: string;
  name: string;
  type: string;
  status: string;
};

export type SearchSupportTicketResult = {
  ticket_id: string;
  subject: string;
  user_id: string;
  priority: string;
  status: string;
};

export type SearchWorkspaceData = {
  users: SearchUserResult[];
  tradingAccounts: SearchTradingAccountResult[];
  brokers: SearchBrokerResult[];
  commissionBatches: SearchCommissionBatchResult[];
  campaigns: SearchCampaignResult[];
  withdrawals: SearchWithdrawalResult[];
  supportTickets: SearchSupportTicketResult[];
};

export type SearchWorkspaceSummary = {
  totalResults: number;
  userCount: number;
  accountCount: number;
  brokerCount: number;
  batchCount: number;
  campaignCount: number;
  withdrawalCount: number;
  supportTicketCount: number;
};

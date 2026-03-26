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
  amount: number;
  status: string;
};

export type SearchWorkspaceData = {
  users: SearchUserResult[];
  tradingAccounts: SearchTradingAccountResult[];
  commissionBatches: SearchCommissionBatchResult[];
  withdrawals: SearchWithdrawalResult[];
};

export type SearchWorkspaceSummary = {
  totalResults: number;
  userCount: number;
  accountCount: number;
  batchCount: number;
  withdrawalCount: number;
};

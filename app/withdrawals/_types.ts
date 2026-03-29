export type ClientWithdrawalHistoryRow = {
  withdrawal_id: string;
  account_id: string | null;
  request_amount: number;
  fee_amount: number;
  net_amount: number;
  currency: string;
  payout_method: string;
  wallet_address: string;
  status:
    | "requested"
    | "under_review"
    | "approved"
    | "rejected"
    | "processing"
    | "completed"
    | "failed"
    | "cancelled";
  requested_at: string;
  reviewed_at: string | null;
  processed_at: string | null;
  rejection_reason: string | null;
};

export type ClientWithdrawalAccount = {
  account_id: string;
  account_number: string | null;
};

export type ClientWithdrawalWorkspace = {
  authenticated: boolean;
  user_id: string | null;
  available_balance: number;
  accounts: ClientWithdrawalAccount[];
  rows: ClientWithdrawalHistoryRow[];
};

export type LedgerEntryType = "rebate" | "commission" | "withdrawal" | "adjustment";
export type WithdrawalStatus = "pending" | "approved" | "rejected" | "posted";

export type LedgerEntry = {
  ledgerRef: string;
  accountId: string | null;
  amount: number;
  currency: string;
  entryType: LedgerEntryType;
  relationship_snapshot_id: string | null;
  createdAt: string;
};

export type Withdrawal = {
  withdrawalId: string;
  accountId: string | null;
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  relationship_snapshot_id: string | null;
  createdAt: string;
};

export type Adjustment = {
  adjustmentId: string;
  accountId: string | null;
  amount: number;
  reason: string;
  createdAt: string;
};

export type ReconciliationRow = {
  reconciliationId: string;
  accountId: string | null;
  status: "matched" | "unmatched" | "needs_review";
  createdAt: string;
};

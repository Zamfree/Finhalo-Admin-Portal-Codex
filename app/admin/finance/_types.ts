import type { FilterBarBaseProps } from "@/types/system/filters";

export type LedgerTransactionType =
  | "rebate_settlement"
  | "withdrawal_request"
  | "manual_adjustment"
  | "reversal"
  | "other";

export type LedgerRow = {
  ledger_ref: string;
  entry_type: string;
  transaction_type: LedgerTransactionType;
  raw_transaction_type?: string | null;
  beneficiary: string;
  user_id?: string | null;
  user_display?: string | null;
  account_id: string;
  trader_user_id: string;
  l1_ib_id?: string | null;
  l2_ib_id?: string | null;
  relationship_snapshot_id?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
  source_batch_id?: string | null;
  source_commission_id?: string | null;
  related_withdrawal_id?: string | null;
  related_rebate_record: string | null;
  currency?: string | null;
  memo?: string | null;
  description?: string | null;
  balance_after?: number | null;
  signed_amount: number;
  source_summary: string;
  allocation_snapshot?: Record<string, unknown> | null;
  raw_record?: Record<string, unknown> | null;
  amount: number;
  direction: "credit" | "debit";
  status: "posted" | "pending" | "reversed";
  created_at: string;
};

export type WithdrawalRow = {
  withdrawal_id: string;
  beneficiary: string;
  user_id: string;
  request_amount: number;
  fee_amount: number;
  net_amount: number;
  currency: string;
  payout_method: string;
  destination: string;
  review_notes?: string | null;
  rejection_reason?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  processed_at?: string | null;
  processed_by?: string | null;
  reserve_ledger_ref?: string | null;
  release_ledger_ref?: string | null;
  payout_ledger_ref?: string | null;
  idempotency_key?: string | null;
  events?: WithdrawalEventRow[];
  linked_ledger_entries?: WithdrawalLinkedLedgerRow[];
  account_id: string;
  trader_user_id: string;
  l1_ib_id?: string | null;
  l2_ib_id?: string | null;
  relationship_snapshot_id?: string | null;
  amount: number;
  fee: number;
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
  wallet_address: string;
  network: string;
};

export type WithdrawalEventRow = {
  event_id: number;
  previous_status: string | null;
  next_status: string;
  actor: string | null;
  reason: string | null;
  notes: string | null;
  created_at: string;
};

export type WithdrawalLinkedLedgerRow = {
  ledger_ref: string;
  reference_id: string | null;
  transaction_type: string;
  direction: "credit" | "debit";
  status: string;
  amount: number;
  currency: string | null;
  memo: string | null;
  created_at: string;
};

export type AdjustmentRow = {
  adjustment_id: string;
  beneficiary: string;
  account_id: string;
  ledger_ref?: string | null;
  adjustment_type: string;
  amount: number;
  reason: string;
  operator: string;
  created_at: string;
};

export type ReconciliationRow = {
  period: string;
  broker: string;
  input_commission_total: number;
  platform_total: number;
  rebate_total: number;
  ledger_total: number;
  paid_total: number;
  difference: number;
  status: "matched" | "review" | "alert";
};

export type FinanceHubData = {
  ledgerRows: LedgerRow[];
  withdrawals: WithdrawalRow[];
  adjustments: AdjustmentRow[];
  reconciliationRows: ReconciliationRow[];
};

export type FinanceSummaryMetric = {
  key: string;
  value: number;
};

export type FinanceOperationalStageKey =
  | "ledger"
  | "withdrawals"
  | "adjustments"
  | "reconciliation";

export type FinanceOperationalStage = {
  key: FinanceOperationalStageKey;
  label: string;
  description: string;
  metricLabel: string;
  metricValue: string;
  href: string;
};

export type LedgerFilters = {
  query: string;
  status: "all" | LedgerRow["status"];
};

export type LedgerViewerFilters = {
  query: string;
  user_id: string;
  account_id: string;
  transaction_type: string;
  direction: "all" | LedgerRow["direction"];
  status: "all" | LedgerRow["status"];
  reference_type: string;
  reference_id: string;
  batch_id: string;
  ledger_ref: string;
  rebate_record_id: string;
  date_from: string;
  date_to: string;
};

export type LedgerViewerPagination = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  visibleFrom: number;
  visibleTo: number;
};

export type LedgerViewerPage = {
  rows: LedgerRow[];
  pagination: LedgerViewerPagination;
};

export type WithdrawalFilters = {
  query: string;
  status: "all" | WithdrawalRow["status"];
  user_id: string;
  account_id: string;
  currency: string;
  payout_method: string;
  date_from: string;
  date_to: string;
};

export type LedgerDrawerTab = "overview" | "context" | "references";
export type WithdrawalDrawerTab = "overview" | "context" | "references";

export type LedgerFilterControls = Pick<
  FilterBarBaseProps<LedgerViewerFilters>,
  "inputFilters" | "setInputFilter" | "applyFilters" | "clearFilters"
>;

export type WithdrawalFilterControls = Pick<
  FilterBarBaseProps<WithdrawalFilters>,
  "inputFilters" | "setInputFilter" | "applyFilters" | "clearFilters"
>;

import type { FilterBarBaseProps } from "@/types/system/filters";

export type LedgerRow = {
  ledger_ref: string;
  entry_type: string;
  beneficiary: string;
  account_id: string;
  trader_user_id: string;
  l1_ib_id?: string | null;
  l2_ib_id?: string | null;
  relationship_snapshot_id?: string | null;
  related_rebate_record: string | null;
  amount: number;
  direction: "credit" | "debit";
  status: "posted" | "pending" | "reversed";
  created_at: string;
};

export type WithdrawalRow = {
  withdrawal_id: string;
  beneficiary: string;
  account_id: string;
  trader_user_id: string;
  l1_ib_id?: string | null;
  l2_ib_id?: string | null;
  relationship_snapshot_id?: string | null;
  amount: number;
  fee: number;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  wallet_address: string;
  network: string;
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

export type WithdrawalFilters = {
  query: string;
  status: "all" | WithdrawalRow["status"];
};

export type LedgerDrawerTab = "overview" | "context" | "references" | "handoff";
export type WithdrawalDrawerTab = "overview" | "context" | "references" | "handoff";

export type LedgerFilterControls = Pick<
  FilterBarBaseProps<LedgerFilters>,
  "inputFilters" | "setInputFilter" | "applyFilters" | "clearFilters"
>;

export type WithdrawalFilterControls = Pick<
  FilterBarBaseProps<WithdrawalFilters>,
  "inputFilters" | "setInputFilter" | "applyFilters" | "clearFilters"
>;

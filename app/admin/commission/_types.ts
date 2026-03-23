export type CommissionBatchStatus =
  | "imported"
  | "validated"
  | "confirmed"
  | "cancelled"
  | "rolled_back"
  | "locked";

export type CommissionValidationResult = "passed" | "failed" | "review";
export type CommissionDuplicateResult = "clear" | "review";

export type CommissionBatch = {
  batch_id: string;
  broker: string;
  source_file: string;
  imported_at: string;
  status: CommissionBatchStatus;
  success_rows: number;
  failed_rows: number;
  error_count: number;
  total_commission: number;
  validation_result: CommissionValidationResult;
  duplicate_result: CommissionDuplicateResult;
  record_count?: number;
};

export type CommissionBatchSourceRow = {
  account_number: string;
  symbol: string;
  volume: number;
  commission_amount: number;
  commission_date: string;
  result: "success" | "failed";
  error?: string;
};

export type CommissionRecord = {
  commission_id: string;
  batch_id: string;
  trader_user_id: string;
  trader_email: string;
  broker: string;
  account_id: string;
  l1_ib_id?: string | null;
  l2_ib_id?: string | null;
  rebate_type: "trader" | "l1" | "l2";
  gross_commission: number;
  rebate_amount: number;
  platform_amount: number;
  platform_rate: number;
  l2_amount: number;
  pool_amount: number;
  trader_amount: number;
  l1_amount: number;
  relationship_snapshot_id?: string | null;
  rebate_record_id?: string | null;
  ledger_ref?: string | null;
  status: "imported" | "validated" | "processed";
  imported_at: string;
  settled_at: string;
};

export type RebateRecord = {
  rebate_id: string;
  beneficiary: string;
  account_id: string;
  amount: number;
  rebate_type: "trader" | "l1" | "l2";
  relationship_snapshot_id?: string | null;
  status: "pending" | "posted" | "reversed";
  created_at: string;
};

export type SimulationPreviewData = {
  broker: string;
  gross_commission: number;
  platform_retained: number;
  l2_commission: number;
  remaining_pool: number;
  trader_cashback: number;
  l1_commission: number;
};

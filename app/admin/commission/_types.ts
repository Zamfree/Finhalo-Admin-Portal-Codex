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
  mapping_status?: "pending" | "mapped" | "failed" | null;
  resolution_status?: "pending" | "in_progress" | "completed" | null;
  resolution_completed_at?: string | null;
  validation_completed_at?: string | null;
  validation_summary?: Record<string, unknown> | null;
  simulation_summary?: Record<string, unknown> | null;
  simulation_error_summary?: Record<string, unknown> | null;
  simulation_completed_at?: string | null;
  simulation_status?: string | null;
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

export type CommissionBatchDecisionMetrics = {
  grossCommission: number;
  totalRebates: number;
  platformRetained: number;
  platformProfitPercent: number | null;
};

export type CommissionBatchIssueSummary = {
  invalidRows: number;
  duplicateRecords: number;
  missingAccounts: number;
};

export type CommissionBatchQueueItem = {
  batch: CommissionBatch;
  sourceRows: CommissionBatchSourceRow[];
  issueRows: CommissionBatchSourceRow[];
  issueSummary: CommissionBatchIssueSummary;
  metrics: CommissionBatchDecisionMetrics | null;
  guardrailBlocked: boolean;
  simulationCompleted: boolean;
  simulationRequired: boolean;
  simulationEligible: boolean;
  workflow: {
    needsReview: boolean;
    isReadyForSettlement: boolean;
    isSettled: boolean;
  };
  decision: {
    label: string;
    tone: CommissionDecisionTone;
  };
  problemSummary: string;
};

export type CommissionQueueWorkspace = {
  items: CommissionBatchQueueItem[];
  profitThresholdPercent: number;
  totalGrossCommission: number;
  reviewQueue: number;
  readyQueue: number;
  finalizedQueue: number;
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

export type CommissionWorkspaceTab = "inputs" | "allocation" | "rebates";

export type CommissionDrawerTab = "overview" | "links";

export type CommissionDecisionTone = "ready" | "review" | "error" | "finalized";

export type CommissionPipelineStageKey =
  | "upload"
  | "validation"
  | "simulation"
  | "batchReview"
  | "settlement";

export type CommissionPipelineStage = {
  key: CommissionPipelineStageKey;
  label: string;
  description: string;
  metricLabel: string;
  metricValue: number | string;
  href: string;
};

export type CommissionOperationalPosture = {
  stageLabel: string;
  nextAction: string;
  linkedModuleLabel: string;
  reviewNote: string;
};

export type CommissionFilters = {
  query: string;
  broker: string;
  date_from: string;
  date_to: string;
};

export type CommissionWorkspaceData = {
  commissionRecords: CommissionRecord[];
  rebateRecords: RebateRecord[];
};

export type SummaryMetric = {
  label: string;
  value: number;
  valueType: "currency" | "count";
  emphasis?: "default" | "strong";
  tone?: "positive" | "negative" | "neutral";
};

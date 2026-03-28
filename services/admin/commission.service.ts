import {
  MOCK_COMMISSION_BATCH_DETAIL,
  MOCK_COMMISSION_BATCH_SOURCE_ROWS,
  MOCK_COMMISSION_BATCHES,
  MOCK_COMMISSION_RECORDS,
  MOCK_REBATE_RECORDS,
  MOCK_SIMULATION_PREVIEW,
} from "@/app/admin/commission/_mock-data";
import {
  getCommissionBatchWorkflowStateWithContext,
  getCommissionDecisionLabelWithContext,
  getCommissionIssueSummary,
  getCommissionProblemSummaryWithContext,
} from "@/app/admin/commission/_mappers";
import type {
  CommissionBatch,
  CommissionBatchDecisionMetrics,
  CommissionBatchQueueItem,
  CommissionBatchSourceRow,
  CommissionBatchStatus,
  CommissionQueueWorkspace,
  CommissionWorkspaceData,
  SimulationPreviewData,
} from "@/app/admin/commission/_types";
import { createClient } from "@/lib/supabase/server";
import { getCommissionProfitThresholdPercent } from "@/services/admin/settings.service";

type CommissionBatchRow = {
  batch_id: string;
  broker: string | null;
  import_date: string | null;
  imported_at?: string | null;
  record_count: number | null;
  status: string | null;
  source_file?: string | null;
  success_rows?: number | null;
  failed_rows?: number | null;
  error_count?: number | null;
  total_commission?: number | null;
  validation_result?: string | null;
  duplicate_result?: string | null;
  simulation_completed_at?: string | null;
  simulation_status?: string | null;
};

type CommissionRecordRow = {
  batch_id: string;
  commission_id?: string | null;
  user_id?: string | null;
  trader_user_id?: string | null;
  trader_email?: string | null;
  broker?: string | null;
  account_id?: string | null;
  account_number: string | null;
  symbol: string | null;
  volume: number | null;
  commission_amount: number | null;
  gross_commission?: number | null;
  rebate_amount?: number | null;
  platform_amount?: number | null;
  platform_rate?: number | null;
  l2_amount?: number | null;
  pool_amount?: number | null;
  trader_amount?: number | null;
  l1_amount?: number | null;
  rebate_type?: string | null;
  relationship_snapshot_id?: string | null;
  rebate_record_id?: string | null;
  ledger_ref?: string | null;
  status?: string | null;
  imported_at?: string | null;
  settled_at?: string | null;
  commission_date: string | null;
  error?: string | null;
  error_message?: string | null;
  validation_error?: string | null;
};

type RebateRecordRow = {
  rebate_id?: string | null;
  id?: string | null;
  beneficiary?: string | null;
  user_email?: string | null;
  account_id?: string | null;
  amount?: number | null;
  rebate_type?: string | null;
  relationship_snapshot_id?: string | null;
  status?: string | null;
  created_at?: string | null;
};

function normalizeBatchStatus(status: string | null | undefined): CommissionBatchStatus {
  if (
    status === "validated" ||
    status === "confirmed" ||
    status === "cancelled" ||
    status === "rolled_back" ||
    status === "locked"
  ) {
    return status;
  }

  return "imported";
}

function normalizeValidationResult(
  value: string | null | undefined,
  failedRows: number,
  status: CommissionBatchStatus
): "passed" | "failed" | "review" {
  if (value === "passed" || value === "failed" || value === "review") {
    return value;
  }

  if (failedRows > 0) {
    return "failed";
  }

  if (status === "validated" || status === "confirmed" || status === "locked") {
    return "passed";
  }

  return "review";
}

function normalizeDuplicateResult(
  value: string | null | undefined,
  status: CommissionBatchStatus
): "clear" | "review" {
  if (value === "clear" || value === "review") {
    return value;
  }

  if (status === "validated" || status === "confirmed" || status === "locked") {
    return "clear";
  }

  return "review";
}

function mapBatchRowToBatch(row: CommissionBatchRow): CommissionBatch {
  const recordCount = row.record_count ?? 0;
  const normalizedStatus = normalizeBatchStatus(row.status);
  const parsedFailedRows = Number(row.failed_rows ?? 0);
  const failedRows = Number.isFinite(parsedFailedRows) ? Math.max(0, parsedFailedRows) : 0;
  const successRows =
    row.success_rows ?? (recordCount > 0 ? Math.max(recordCount - failedRows, 0) : 0);
  const errorCount = row.error_count ?? failedRows;
  const totalCommission = Number(row.total_commission ?? 0);

  return {
    batch_id: row.batch_id,
    broker: row.broker ?? "Unknown Broker",
    source_file: row.source_file?.trim() || `${row.broker ?? "broker"} upload`,
    imported_at: row.imported_at ?? row.import_date ?? new Date().toISOString(),
    status: normalizedStatus,
    success_rows: successRows,
    failed_rows: failedRows,
    error_count: errorCount,
    total_commission: Number.isFinite(totalCommission) ? totalCommission : 0,
    validation_result: normalizeValidationResult(
      row.validation_result,
      failedRows,
      normalizedStatus
    ),
    duplicate_result: normalizeDuplicateResult(row.duplicate_result, normalizedStatus),
    simulation_completed_at: row.simulation_completed_at ?? null,
    simulation_status: row.simulation_status ?? null,
    record_count: recordCount,
  };
}

function mapRecordRowToSourceRow(row: CommissionRecordRow): CommissionBatchSourceRow {
  const sourceError = row.error ?? row.error_message ?? row.validation_error ?? undefined;

  return {
    account_number: row.account_number ?? "-",
    symbol: row.symbol ?? "-",
    volume: row.volume ?? 0,
    commission_amount: row.commission_amount ?? 0,
    commission_date: row.commission_date ?? "-",
    result: sourceError ? "failed" : "success",
    error: sourceError,
  };
}

function mapCommissionRecordRow(row: CommissionRecordRow) {
  const commissionId = row.commission_id?.trim() || `COM-${row.batch_id}-${row.account_number ?? "ROW"}`;
  const accountId = row.account_id?.trim() || row.account_number?.trim() || "UNKNOWN";
  const grossCommission = row.gross_commission ?? row.commission_amount ?? 0;
  const rebateAmount = row.rebate_amount ?? 0;
  const platformAmount = row.platform_amount ?? 0;

  return {
    commission_id: commissionId,
    batch_id: row.batch_id,
    trader_user_id: row.trader_user_id?.trim() || row.user_id?.trim() || "UNKNOWN",
    trader_email: row.trader_email?.trim() || "unknown@commission.local",
    broker: row.broker?.trim() || "Unknown Broker",
    account_id: accountId,
    l1_ib_id: null,
    l2_ib_id: null,
    rebate_type:
      row.rebate_type === "l1" || row.rebate_type === "l2" ? row.rebate_type : "trader",
    gross_commission: grossCommission,
    rebate_amount: rebateAmount,
    platform_amount: platformAmount,
    platform_rate: row.platform_rate ?? (grossCommission > 0 ? platformAmount / grossCommission : 0),
    l2_amount: row.l2_amount ?? 0,
    pool_amount: row.pool_amount ?? Math.max(grossCommission - platformAmount, 0),
    trader_amount: row.trader_amount ?? rebateAmount,
    l1_amount: row.l1_amount ?? 0,
    relationship_snapshot_id: row.relationship_snapshot_id ?? null,
    rebate_record_id: row.rebate_record_id ?? null,
    ledger_ref: row.ledger_ref ?? null,
    status:
      row.status === "validated" || row.status === "processed" ? row.status : "imported",
    imported_at: row.imported_at ?? new Date().toISOString(),
    settled_at: row.settled_at ?? row.commission_date ?? new Date().toISOString(),
  };
}

function mapRebateRecordRow(row: RebateRecordRow) {
  return {
    rebate_id: row.rebate_id?.trim() || row.id?.trim() || "REB-UNKNOWN",
    beneficiary: row.beneficiary?.trim() || row.user_email?.trim() || "unknown@rebate.local",
    account_id: row.account_id?.trim() || "UNKNOWN",
    amount: row.amount ?? 0,
    rebate_type:
      row.rebate_type === "l1" || row.rebate_type === "l2" ? row.rebate_type : "trader",
    relationship_snapshot_id: row.relationship_snapshot_id ?? null,
    status:
      row.status === "posted" || row.status === "reversed" ? row.status : "pending",
    created_at: row.created_at ?? new Date().toISOString(),
  };
}

function buildDecisionMetricsByBatch(records: CommissionWorkspaceData["commissionRecords"]) {
  return records.reduce<Record<string, CommissionBatchDecisionMetrics>>((accumulator, record) => {
    const current = accumulator[record.batch_id] ?? {
      grossCommission: 0,
      totalRebates: 0,
      platformRetained: 0,
      platformProfitPercent: null,
    };

    current.grossCommission += record.gross_commission;
    current.totalRebates += record.rebate_amount;
    current.platformRetained += record.platform_amount;
    current.platformProfitPercent =
      current.grossCommission > 0
        ? (current.platformRetained / current.grossCommission) * 100
        : null;

    accumulator[record.batch_id] = current;
    return accumulator;
  }, {});
}

export async function getAdminCommissionWorkspace(): Promise<CommissionWorkspaceData> {
  try {
    const supabase = await createClient();
    const [commissionResult, rebateResult] = await Promise.all([
      supabase.from("commission_records").select("*").order("commission_date", { ascending: false }),
      supabase.from("rebate_records").select("*").order("created_at", { ascending: false }),
    ]);

    if (!commissionResult.error && commissionResult.data && commissionResult.data.length > 0) {
      return {
        commissionRecords: (commissionResult.data as CommissionRecordRow[]).map(
          mapCommissionRecordRow
        ),
        rebateRecords:
          !rebateResult.error && rebateResult.data
            ? (rebateResult.data as RebateRecordRow[]).map(mapRebateRecordRow)
            : MOCK_REBATE_RECORDS,
      };
    }
  } catch {
    // Fall through to mock data.
  }

  return {
    commissionRecords: MOCK_COMMISSION_RECORDS,
    rebateRecords: MOCK_REBATE_RECORDS,
  };
}

export async function getAdminCommissionBatches(): Promise<CommissionBatch[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("commission_batches")
      .select("*")
      .order("import_date", { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((row) => mapBatchRowToBatch(row as CommissionBatchRow));
    }
  } catch {
    // Fall through to mock data.
  }

  return MOCK_COMMISSION_BATCHES;
}

export async function getAdminCommissionBatchById(batchId: string): Promise<CommissionBatch | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("commission_batches")
      .select("*")
      .eq("batch_id", batchId)
      .maybeSingle();

    if (!error && data) {
      return mapBatchRowToBatch(data as CommissionBatchRow);
    }
  } catch {
    // Fall through to mock data.
  }

  const batch = MOCK_COMMISSION_BATCHES.find((item) => item.batch_id === batchId);

  if (batch) {
    return batch;
  }

  if (MOCK_COMMISSION_BATCH_DETAIL.batch_id === batchId) {
    return MOCK_COMMISSION_BATCH_DETAIL;
  }

  return null;
}

export async function getAdminCommissionBatchSourceRows(
  batchId: string
): Promise<CommissionBatchSourceRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("commission_records")
      .select("*")
      .eq("batch_id", batchId)
      .order("commission_date", { ascending: false });

    if (!error && data && data.length > 0) {
      const mappedRows = data.map((row) => mapRecordRowToSourceRow(row as CommissionRecordRow));
      const duplicateCountByKey = mappedRows.reduce<Map<string, number>>((accumulator, row) => {
        const duplicateKey = `${row.account_number}__${row.symbol}__${row.commission_date}`;
        accumulator.set(duplicateKey, (accumulator.get(duplicateKey) ?? 0) + 1);
        return accumulator;
      }, new Map());

      return mappedRows.map((row) => {
        const duplicateKey = `${row.account_number}__${row.symbol}__${row.commission_date}`;
        const hasDuplicate = (duplicateCountByKey.get(duplicateKey) ?? 0) > 1;

        if (!hasDuplicate) {
          return row;
        }

        return {
          ...row,
          result: "failed",
          error: row.error ? `${row.error} | Duplicate record` : "Duplicate record",
        };
      });
    }
  } catch {
    // Fall through to mock data.
  }

  return MOCK_COMMISSION_BATCH_SOURCE_ROWS;
}

export async function getAdminCommissionSimulationPreview(): Promise<SimulationPreviewData> {
  return MOCK_SIMULATION_PREVIEW;
}

export async function getAdminCommissionQueueWorkspace(): Promise<CommissionQueueWorkspace> {
  const [batches, workspace, profitThresholdPercent] = await Promise.all([
    getAdminCommissionBatches(),
    getAdminCommissionWorkspace(),
    getCommissionProfitThresholdPercent(),
  ]);

  const metricsByBatch = buildDecisionMetricsByBatch(workspace.commissionRecords);
  const sourceRowsEntries = await Promise.all(
    batches.map(async (batch) => {
      const sourceRows = await getAdminCommissionBatchSourceRows(batch.batch_id);
      return [batch.batch_id, sourceRows] as const;
    })
  );

  const items: CommissionBatchQueueItem[] = sourceRowsEntries.map(([batchId, sourceRows]) => {
    const batch = batches.find((item) => item.batch_id === batchId);

    if (!batch) {
      throw new Error(`Missing commission batch for ${batchId}.`);
    }

    const issueRows = sourceRows.filter((row) => row.result !== "success" || Boolean(row.error));
    const metrics = metricsByBatch[batchId] ?? null;
    const guardrailBlocked =
      metrics?.platformProfitPercent !== null &&
      metrics?.platformProfitPercent !== undefined &&
      metrics.platformProfitPercent < profitThresholdPercent;
    const normalizedSimulationStatus = (batch.simulation_status ?? "").trim().toLowerCase();
    const simulationCompleted =
      Boolean(batch.simulation_completed_at) ||
      normalizedSimulationStatus === "completed" ||
      normalizedSimulationStatus === "done";
    const simulationRequired = batch.status === "validated";
    const simulationEligible =
      simulationRequired &&
      batch.failed_rows === 0 &&
      batch.validation_result === "passed" &&
      batch.duplicate_result === "clear";
    const workflow = getCommissionBatchWorkflowStateWithContext(batch, {
      guardrailBlocked,
      simulationCompleted,
      simulationRequired,
    });
    const decision = getCommissionDecisionLabelWithContext(batch, {
      guardrailBlocked,
      simulationCompleted,
      simulationRequired,
    });
    const problemSummary = getCommissionProblemSummaryWithContext(batch, {
      guardrailBlocked,
      simulationCompleted,
      simulationRequired,
    });
    const issueSummary = getCommissionIssueSummary(issueRows);

    return {
      batch,
      sourceRows,
      issueRows,
      issueSummary,
      metrics,
      guardrailBlocked,
      simulationCompleted,
      simulationRequired,
      simulationEligible,
      workflow,
      decision,
      problemSummary,
    };
  });

  return {
    items,
    profitThresholdPercent,
    totalGrossCommission: items.reduce(
      (sum, item) => sum + (item.metrics?.grossCommission ?? item.batch.total_commission),
      0
    ),
    reviewQueue: items.filter((item) => item.workflow.needsReview).length,
    readyQueue: items.filter((item) => item.workflow.isReadyForSettlement).length,
    finalizedQueue: items.filter((item) => item.workflow.isSettled).length,
  };
}

"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type CommissionBatchWorkflowState = {
  error?: string;
  success?: string;
};

function normalizeBatchId(batchId: string) {
  return batchId.trim();
}

function getBatchIdFromFormData(formData: FormData) {
  return normalizeBatchId(String(formData.get("batch_id") ?? ""));
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isMissingColumnError(message: string) {
  return /column .* does not exist/i.test(message);
}

function isUniqueViolation(message: string) {
  return /duplicate key|already exists|unique/i.test(message);
}

type BatchEnvironment = "live" | "test";

function normalizeBatchEnvironment(value: unknown): BatchEnvironment {
  return value === "test" ? "test" : "live";
}

type ConfirmCommissionBatchRpcRow = {
  batch_id: string;
  environment: BatchEnvironment;
  rebates_created: number;
  rebates_reused: number;
  ledger_created: number;
  ledger_reused: number;
  final_status: string;
};

type DownstreamEligibilitySnapshot = {
  totalRows: number;
  mappedRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  resolvedRows: number;
  excludedRows: number;
  eligibleRows: number;
  blockedRows: number;
  nextRequiredAction: string;
};

const COMMISSION_LEDGER_REFERENCE_TYPE = "commission_batch_approval";
const MIN_PLATFORM_RATE = 0.1;
const CALC_PRECISION = 1_000_000;
const CALC_EPSILON = 1 / CALC_PRECISION;

type CommissionRecordValidationRow = Record<string, unknown>;
type CommissionApprovalRecordRow = Record<string, unknown>;
type AllocationRole = "trader" | "l1" | "l2";

type RelationshipResolution = {
  traderAccountId: string;
  traderUserId: string;
  l1UserId: string | null;
  l2UserId: string | null;
  relationshipSnapshotId: string | null;
  relationshipRow: CommissionApprovalRecordRow | null;
};

type WaterfallRates = {
  platformRate: number;
  l2Rate: number;
  cSplitRate: number;
};

type WaterfallAmounts = {
  grossCommission: number;
  platformAmount: number;
  l2Amount: number;
  poolAmount: number;
  traderAmount: number;
  l1Amount: number;
};

type AllocationLine = {
  role: AllocationRole;
  amount: number;
  beneficiaryUserId: string;
  allocationRef: string;
  rebateBusinessId: string;
  referenceId: string;
  ledgerRef: string;
};

type AllocationLookupCache = {
  accountByLookupKey: Map<string, { accountId: string | null; traderUserId: string | null }>;
  relationshipsByAccountId: Map<string, CommissionApprovalRecordRow[]>;
};

type BatchValidationSummary = {
  totalRows: number;
  successRows: number;
  failedRows: number;
  errorCount: number;
  duplicateGroups: number;
  validationResult: "passed" | "failed";
  duplicateResult: "clear" | "review";
};

function hasRequiredText(value: unknown) {
  return asString(value).trim().length > 0;
}

function hasNumericValue(value: unknown) {
  return Number.isFinite(Number(value));
}

function hasValidationErrorFlag(row: CommissionRecordValidationRow) {
  const errorFields = [row.error, row.error_message, row.validation_error];
  return errorFields.some((field) => asString(field).trim().length > 0);
}

function getDuplicateKey(row: CommissionRecordValidationRow) {
  const accountNumber = asString(row.account_number).trim().toLowerCase();
  const symbol = asString(row.symbol).trim().toLowerCase();
  const commissionDate = asString(row.commission_date).trim().toLowerCase();

  if (!accountNumber || !symbol || !commissionDate) {
    return "";
  }

  return `${accountNumber}__${symbol}__${commissionDate}`;
}

function countDuplicateGroups(rows: CommissionRecordValidationRow[]) {
  const duplicateCountByKey = new Map<string, number>();

  for (const row of rows) {
    const key = getDuplicateKey(row);
    if (!key) {
      continue;
    }

    duplicateCountByKey.set(key, (duplicateCountByKey.get(key) ?? 0) + 1);
  }

  return [...duplicateCountByKey.values()].filter((count) => count > 1).length;
}

function buildBatchValidationSummary(rows: CommissionRecordValidationRow[]): BatchValidationSummary {
  const duplicateGroups = countDuplicateGroups(rows);

  let failedRows = 0;
  for (const row of rows) {
    const hasMissingRequiredField =
      !hasRequiredText(row.user_id) ||
      !hasRequiredText(row.account_number) ||
      !hasRequiredText(row.symbol) ||
      !hasRequiredText(row.commission_date);
    const hasInvalidNumericValue =
      !hasNumericValue(row.volume) || !hasNumericValue(row.commission_amount);
    const hasValidationError = hasValidationErrorFlag(row);

    if (hasMissingRequiredField || hasInvalidNumericValue || hasValidationError) {
      failedRows += 1;
    }
  }

  const totalRows = rows.length;
  const successRows = Math.max(totalRows - failedRows, 0);

  return {
    totalRows,
    successRows,
    failedRows,
    errorCount: failedRows,
    duplicateGroups,
    validationResult: failedRows > 0 ? "failed" : "passed",
    duplicateResult: duplicateGroups > 0 ? "review" : "clear",
  };
}

async function applyBatchValidationSummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  batchId: string,
  summary: BatchValidationSummary
) {
  const timestamp = new Date().toISOString();
  const payloadAttempts: Array<Record<string, unknown>> = [
    {
      status: "validated",
      validation_result: summary.validationResult,
      duplicate_result: summary.duplicateResult,
      success_rows: summary.successRows,
      failed_rows: summary.failedRows,
      error_count: summary.errorCount,
      simulation_status: "pending",
      simulation_completed_at: null,
      updated_at: timestamp,
    },
    {
      status: "validated",
      validation_result: summary.validationResult,
      duplicate_result: summary.duplicateResult,
      success_rows: summary.successRows,
      failed_rows: summary.failedRows,
      error_count: summary.errorCount,
      updated_at: timestamp,
    },
    {
      status: "validated",
      validation_result: summary.validationResult,
      duplicate_result: summary.duplicateResult,
    },
  ];

  let lastErrorMessage = `Failed to save validation summary for ${batchId}.`;

  for (const payload of payloadAttempts) {
    const { data, error } = await supabase
      .from("commission_batches")
      .update(payload)
      .eq("batch_id", batchId)
      .select("batch_id")
      .maybeSingle();

    if (!error && data) {
      return { ok: true as const };
    }

    if (error) {
      lastErrorMessage = error.message;

      if (!isMissingColumnError(error.message)) {
        break;
      }
    }
  }

  return { ok: false as const, error: lastErrorMessage };
}

async function markBatchSimulationCompleted(
  supabase: Awaited<ReturnType<typeof createClient>>,
  batchId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const timestamp = new Date().toISOString();
  const { data, error } = await supabase
    .from("commission_batches")
    .update({ simulation_completed_at: timestamp, simulation_status: "completed" })
    .eq("batch_id", batchId)
    .select("batch_id")
    .maybeSingle();

  if (!error && data) {
    return { ok: true };
  }

  if (error && isMissingColumnError(error.message)) {
    return {
      ok: false,
      error:
        "Simulation metadata columns are missing on commission_batches. Run supabase/migrations/20260327_commission_simulation_gate.sql first.",
    };
  }

  if (error) {
    return {
      ok: false,
      error: `Unable to persist simulation completion for ${batchId}: ${error.message}`,
    };
  }

  return {
    ok: false,
    error: `Unable to persist simulation completion for ${batchId}.`,
  };
}

async function validateBatchReadyForApproval(
  supabase: Awaited<ReturnType<typeof createClient>>,
  batchId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: batch, error: batchError } = await supabase
    .from("commission_batches")
    .select("*")
    .eq("batch_id", batchId)
    .maybeSingle();

  if (batchError) {
    return {
      ok: false,
      error: `Unable to load commission batch ${batchId}: ${batchError.message}`,
    };
  }

  if (!batch) {
    return {
      ok: false,
      error: `Unable to approve batch ${batchId}: batch not found.`,
    };
  }

  const normalizedStatus = asString((batch as Record<string, unknown>).status)
    .trim()
    .toLowerCase();
  if (normalizedStatus !== "validated") {
    return {
      ok: false,
      error: `Batch ${batchId} is "${normalizedStatus || "unknown"}". Only validated batches can be approved.`,
    };
  }

  const failedRows = asNumber((batch as Record<string, unknown>).failed_rows, 0);
  if (failedRows > 0) {
    return {
      ok: false,
      error: `Batch ${batchId} still has ${failedRows} failed rows and cannot be approved.`,
    };
  }

  const validationResult = asString((batch as Record<string, unknown>).validation_result, "passed")
    .trim()
    .toLowerCase();
  if (validationResult && validationResult !== "passed") {
    return {
      ok: false,
      error: `Batch ${batchId} validation state is "${validationResult}", so approval is blocked.`,
    };
  }

  const duplicateResult = asString((batch as Record<string, unknown>).duplicate_result, "clear")
    .trim()
    .toLowerCase();
  if (duplicateResult && duplicateResult !== "clear") {
    return {
      ok: false,
      error: `Batch ${batchId} duplicate review is "${duplicateResult}", so approval is blocked.`,
    };
  }

  const { data: records, error: recordsError } = await supabase
    .from("commission_records")
    .select("status")
    .eq("batch_id", batchId);

  if (recordsError) {
    return {
      ok: false,
      error: `Unable to evaluate simulation gate for batch ${batchId}: ${recordsError.message}`,
    };
  }

  if (!records || records.length === 0) {
    return {
      ok: false,
      error: `Batch ${batchId} has no commission records. Approval is blocked.`,
    };
  }

  const batchRecord = batch as Record<string, unknown>;
  const simulationCompletedAt =
    asString((batch as Record<string, unknown>).simulation_completed_at) ||
    asString((batch as Record<string, unknown>).simulated_at) ||
    asString((batch as Record<string, unknown>).preview_completed_at);
  const simulationStatus = asString((batch as Record<string, unknown>).simulation_status)
    .trim()
    .toLowerCase();
  const hasSimulationColumns =
    "simulation_completed_at" in batchRecord ||
    "simulation_status" in batchRecord ||
    "simulated_at" in batchRecord ||
    "preview_completed_at" in batchRecord;
  const simulationCompleted =
    Boolean(simulationCompletedAt) ||
    simulationStatus === "completed" ||
    simulationStatus === "done";

  if (!hasSimulationColumns) {
    return {
      ok: false,
      error:
        "Simulation metadata columns are missing on commission_batches. Run supabase/migrations/20260327_commission_simulation_gate.sql first.",
    };
  }

  if (!simulationCompleted) {
    return {
      ok: false,
      error: `Batch ${batchId} must complete simulation before approval.`,
    };
  }

  return { ok: true };
}

export async function completeCommissionBatchSimulation(
  batchId: string
): Promise<CommissionBatchWorkflowState> {
  const normalizedBatchId = normalizeBatchId(batchId);

  if (!normalizedBatchId) {
    return { error: "Batch ID is required." };
  }

  const supabase = await createClient();

  const { data: batch, error: batchError } = await supabase
    .from("commission_batches")
    .select("*")
    .eq("batch_id", normalizedBatchId)
    .maybeSingle();

  if (batchError) {
    return {
      error: `Unable to load batch ${normalizedBatchId}: ${batchError.message}`,
    };
  }

  if (!batch) {
    return {
      error: `Batch ${normalizedBatchId} not found.`,
    };
  }

  const normalizedStatus = asString((batch as Record<string, unknown>).status)
    .trim()
    .toLowerCase();
  if (normalizedStatus !== "validated") {
    return {
      error: `Batch ${normalizedBatchId} is \"${normalizedStatus || "unknown"}\". Only validated batches can be marked as simulation completed.`,
    };
  }

  const failedRows = asNumber((batch as Record<string, unknown>).failed_rows, 0);
  if (failedRows > 0) {
    return {
      error: `Batch ${normalizedBatchId} still has failed rows and cannot be simulation-completed.`,
    };
  }

  const validationResult = asString((batch as Record<string, unknown>).validation_result, "passed")
    .trim()
    .toLowerCase();
  if (validationResult !== "passed") {
    return {
      error: `Batch ${normalizedBatchId} validation state is \"${validationResult}\", so simulation completion is blocked.`,
    };
  }

  const duplicateResult = asString((batch as Record<string, unknown>).duplicate_result, "clear")
    .trim()
    .toLowerCase();
  if (duplicateResult !== "clear") {
    return {
      error: `Batch ${normalizedBatchId} duplicate review is \"${duplicateResult}\", so simulation completion is blocked.`,
    };
  }

  const mappingStatus = asString((batch as Record<string, unknown>).mapping_status).trim().toLowerCase();
  if (mappingStatus && mappingStatus !== "mapped") {
    return {
      error: `Batch ${normalizedBatchId} mapping status is "${mappingStatus}". Complete mapping before simulation.`,
    };
  }

  const resolutionStatus = asString((batch as Record<string, unknown>).resolution_status)
    .trim()
    .toLowerCase();
  if (resolutionStatus && resolutionStatus !== "completed") {
    return {
      error: `Batch ${normalizedBatchId} resolution status is "${resolutionStatus}". Complete resolution before simulation.`,
    };
  }

  const existingSimulationStatus = asString((batch as Record<string, unknown>).simulation_status)
    .trim()
    .toLowerCase();
  const existingSimulationCompletedAt = asString(
    (batch as Record<string, unknown>).simulation_completed_at
  ).trim();
  if (existingSimulationStatus === "completed" && existingSimulationCompletedAt) {
    return {
      success: `Batch ${normalizedBatchId} simulation is already completed.`,
    };
  }

  const simulationSummary = (batch as Record<string, unknown>).simulation_summary;
  if (!simulationSummary || typeof simulationSummary !== "object") {
    return {
      error: `Batch ${normalizedBatchId} has no persisted simulation summary. Run simulation from the upload workflow first.`,
    };
  }

  const summaryRecord = simulationSummary as Record<string, unknown>;
  const blockedRows = asNumber(summaryRecord.blocked_rows, asNumber(summaryRecord.blockedRows, 0));
  if (blockedRows > 0) {
    return {
      error: `Batch ${normalizedBatchId} simulation has ${blockedRows} blockers. Resolve issues before marking simulation complete.`,
    };
  }

  const eligibilitySnapshotResult = await loadDownstreamEligibilitySnapshot(supabase, normalizedBatchId);
  if (!eligibilitySnapshotResult.ok) {
    return { error: eligibilitySnapshotResult.error };
  }

  if (eligibilitySnapshotResult.snapshot.blockedRows > 0) {
    return {
      error: `Batch ${normalizedBatchId} still has ${eligibilitySnapshotResult.snapshot.blockedRows} blocking staging rows (${eligibilitySnapshotResult.snapshot.nextRequiredAction}).`,
    };
  }

  const { error: recordsError } = await supabase
    .from("commission_records")
    .select("commission_id")
    .eq("batch_id", normalizedBatchId)
    .limit(1);

  if (recordsError) {
    return {
      error: `Unable to verify commission records for ${normalizedBatchId}: ${recordsError.message}`,
    };
  }

  const marked = await markBatchSimulationCompleted(supabase, normalizedBatchId);
  if (!marked.ok) {
    return { error: marked.error };
  }

  revalidatePath("/admin/commission");
  revalidatePath("/admin/commission/upload");
  revalidatePath("/admin/commission/batches");
  revalidatePath(`/admin/commission/batches/${normalizedBatchId}`);

  return {
    success: `Batch ${normalizedBatchId} simulation marked as completed.`,
  };
}

async function updateCommissionBatchStatus(
  batchId: string,
  status: "confirmed" | "cancelled" | "rolled_back",
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("commission_batches")
    .update({ status })
    .eq("batch_id", batchId)
    .select("batch_id")
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return true;
}

async function lockCommissionBatchForApproval(
  supabase: Awaited<ReturnType<typeof createClient>>,
  batchId: string
): Promise<{ ok: true; environment: BatchEnvironment } | { ok: false; error: string }> {
  const payloadAttempts: Array<Record<string, unknown>> = [
    { status: "locked", updated_at: new Date().toISOString() },
    { status: "locked" },
  ];

  for (const payload of payloadAttempts) {
    const { data, error } = await supabase
      .from("commission_batches")
      .update(payload)
      .eq("batch_id", batchId)
      .eq("status", "validated")
      .select("batch_id,environment")
      .maybeSingle();

    if (!error && data) {
      const environment = normalizeBatchEnvironment(
        (data as Record<string, unknown>).environment
      );
      return { ok: true, environment };
    }

    if (error && !isMissingColumnError(error.message)) {
      return {
        ok: false,
        error: `Unable to lock batch ${batchId} for approval: ${error.message}`,
      };
    }
  }

  const { data: currentBatch, error: currentBatchError } = await supabase
    .from("commission_batches")
    .select("batch_id,status")
    .eq("batch_id", batchId)
    .maybeSingle();

  if (currentBatchError) {
    return {
      ok: false,
      error: `Unable to load current batch state for ${batchId}: ${currentBatchError.message}`,
    };
  }

  if (!currentBatch) {
    return { ok: false, error: `Batch ${batchId} was not found.` };
  }

  const status = asString((currentBatch as Record<string, unknown>).status).trim().toLowerCase();

  if (status === "confirmed" || status === "locked") {
    return {
      ok: false,
      error: `Batch ${batchId} has already been approved and cannot be approved again.`,
    };
  }

  if (status === "cancelled" || status === "rolled_back") {
    return {
      ok: false,
      error: `Batch ${batchId} is ${status}. Reset batch status explicitly before approval.`,
    };
  }

  return {
    ok: false,
    error: `Batch ${batchId} is "${status || "unknown"}". Only validated batches can be approved.`,
  };
}

async function setLockedBatchToStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  batchId: string,
  nextStatus: "validated" | "confirmed"
): Promise<{ ok: true } | { ok: false; error: string }> {
  const payloadAttempts: Array<Record<string, unknown>> = [
    { status: nextStatus, updated_at: new Date().toISOString() },
    { status: nextStatus },
  ];

  let lastErrorMessage = `Failed to set batch ${batchId} to ${nextStatus}.`;

  for (const payload of payloadAttempts) {
    const { data, error } = await supabase
      .from("commission_batches")
      .update(payload)
      .eq("batch_id", batchId)
      .eq("status", "locked")
      .select("batch_id")
      .maybeSingle();

    if (!error && data) {
      return { ok: true };
    }

    if (error) {
      lastErrorMessage = error.message;

      if (!isMissingColumnError(error.message)) {
        break;
      }
    }
  }

  return { ok: false, error: lastErrorMessage };
}

function getCommissionRecordBusinessId(
  row: CommissionApprovalRecordRow,
  index: number,
  batchId: string
) {
  const commissionId = asString(row.commission_id).trim();
  if (commissionId) {
    return commissionId;
  }

  return `${batchId}-ROW-${index + 1}`;
}

function roundForCalc(value: number) {
  return Math.round(value * CALC_PRECISION) / CALC_PRECISION;
}

function normalizeRate(value: unknown): number | null {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  if (parsed <= 1) {
    return parsed;
  }

  if (parsed <= 100) {
    return parsed / 100;
  }

  return null;
}

function parseDateMs(value: unknown): number | null {
  const parsed = Date.parse(asString(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function pickRelationshipRowForCommissionDate(
  rows: CommissionApprovalRecordRow[],
  commissionDate: string
) {
  if (rows.length === 0) {
    return null;
  }

  const commissionDateMs = parseDateMs(commissionDate);

  if (commissionDateMs === null) {
    const current = rows.find((row) => Boolean(row.is_current));
    return current ?? rows[0];
  }

  for (const row of rows) {
    const effectiveFromMs = parseDateMs(row.effective_from);
    const effectiveToMs = parseDateMs(row.effective_to);
    const fromOk = effectiveFromMs === null || effectiveFromMs <= commissionDateMs;
    const toOk = effectiveToMs === null || effectiveToMs >= commissionDateMs;

    if (fromOk && toOk) {
      return row;
    }
  }

  const current = rows.find((row) => Boolean(row.is_current));
  return current ?? rows[0];
}

async function resolveAccountContextForRecord(
  supabase: Awaited<ReturnType<typeof createClient>>,
  row: CommissionApprovalRecordRow,
  lookupCache: AllocationLookupCache
) {
  const accountId = asString(row.account_id).trim();
  const accountNumber = asString(row.account_number).trim();
  const lookupKey = `${accountId}::${accountNumber}`;

  const cached = lookupCache.accountByLookupKey.get(lookupKey);
  if (cached) {
    return cached;
  }

  let resolvedAccountId = accountId || null;
  let resolvedTraderUserId =
    asString(row.trader_user_id).trim() || asString(row.user_id).trim() || null;

  if ((!resolvedAccountId || !resolvedTraderUserId) && accountNumber) {
    const keyAttempts = ["account_number", "account_id", "account_code"] as const;

    for (const key of keyAttempts) {
      const { data, error } = await supabase
        .from("trading_accounts")
        .select("account_id,user_id")
        .eq(key, accountNumber)
        .maybeSingle();

      if (!error && data) {
        const accountRow = data as Record<string, unknown>;
        resolvedAccountId = asString(accountRow.account_id).trim() || resolvedAccountId;
        resolvedTraderUserId = asString(accountRow.user_id).trim() || resolvedTraderUserId;
        break;
      }

      if (error && !isMissingColumnError(error.message)) {
        break;
      }
    }
  }

  const resolved = {
    accountId: resolvedAccountId,
    traderUserId: resolvedTraderUserId,
  };
  lookupCache.accountByLookupKey.set(lookupKey, resolved);
  return resolved;
}

async function getRelationshipRowsForAccount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accountId: string,
  lookupCache: AllocationLookupCache
): Promise<{ ok: true; rows: CommissionApprovalRecordRow[] } | { ok: false; error: string }> {
  const cached = lookupCache.relationshipsByAccountId.get(accountId);
  if (cached) {
    return { ok: true, rows: cached };
  }

  const { data, error } = await supabase
    .from("ib_relationships")
    .select("*")
    .eq("account_id", accountId)
    .order("effective_from", { ascending: false });

  if (error) {
    return {
      ok: false,
      error: `Unable to resolve account relationship for ${accountId}: ${error.message}`,
    };
  }

  const rows = (data as CommissionApprovalRecordRow[] | null) ?? [];
  lookupCache.relationshipsByAccountId.set(accountId, rows);
  return { ok: true, rows };
}

async function resolveRelationshipForCommissionRecord(
  supabase: Awaited<ReturnType<typeof createClient>>,
  row: CommissionApprovalRecordRow,
  lookupCache: AllocationLookupCache
): Promise<{ ok: true; value: RelationshipResolution } | { ok: false; error: string }> {
  const accountContext = await resolveAccountContextForRecord(supabase, row, lookupCache);
  const resolvedAccountId =
    accountContext.accountId ||
    asString(row.account_id).trim() ||
    asString(row.account_number).trim() ||
    "";

  if (!resolvedAccountId) {
    return {
      ok: false,
      error: "Unable to resolve trader account for commission record. Account-level relationship is required.",
    };
  }

  const relationshipRows = await getRelationshipRowsForAccount(
    supabase,
    resolvedAccountId,
    lookupCache
  );
  if (!relationshipRows.ok) {
    return { ok: false, error: relationshipRows.error };
  }

  const relationshipRow = pickRelationshipRowForCommissionDate(
    relationshipRows.rows,
    asString(row.commission_date)
  );

  const traderUserId =
    asString(relationshipRow?.trader_user_id).trim() ||
    asString(relationshipRow?.trader_id).trim() ||
    accountContext.traderUserId ||
    asString(row.trader_user_id).trim() ||
    asString(row.user_id).trim();
  const l1UserId =
    asString(relationshipRow?.l1_ib_id).trim() || asString(row.l1_ib_id).trim() || null;
  const l2UserId =
    asString(relationshipRow?.l2_ib_id).trim() || asString(row.l2_ib_id).trim() || null;
  const relationshipSnapshotId =
    asString(relationshipRow?.snapshot_id).trim() ||
    asString(relationshipRow?.relationship_snapshot_id).trim() ||
    asString(relationshipRow?.id).trim() ||
    asString(row.relationship_snapshot_id).trim() ||
    `REL-${resolvedAccountId}`;

  if (!traderUserId) {
    return {
      ok: false,
      error: `Unable to resolve trader user for account ${resolvedAccountId}.`,
    };
  }

  if (l2UserId && l2UserId === traderUserId) {
    return {
      ok: false,
      error: `Invalid relationship snapshot ${relationshipSnapshotId}: L2 (${l2UserId}) cannot equal trader (${traderUserId}).`,
    };
  }

  return {
    ok: true,
    value: {
      traderAccountId: resolvedAccountId,
      traderUserId,
      l1UserId,
      l2UserId,
      relationshipSnapshotId,
      relationshipRow,
    },
  };
}

function pickRateFromCandidates(values: unknown[]) {
  for (const value of values) {
    const normalized = normalizeRate(value);
    if (normalized !== null) {
      return normalized;
    }
  }

  return null;
}

function computeWaterfallForRecord(
  row: CommissionApprovalRecordRow,
  relationship: RelationshipResolution
): { ok: true; rates: WaterfallRates; amounts: WaterfallAmounts } | { ok: false; error: string } {
  const grossCommission = roundForCalc(
    asNumber(row.gross_commission, asNumber(row.commission_amount, 0))
  );

  if (grossCommission < 0) {
    return { ok: false, error: `Gross commission ${grossCommission} cannot be negative.` };
  }

  if (grossCommission === 0) {
    return {
      ok: true,
      rates: {
        platformRate: MIN_PLATFORM_RATE,
        l2Rate: 0,
        cSplitRate: relationship.l1UserId ? 0 : 1,
      },
      amounts: {
        grossCommission: 0,
        platformAmount: 0,
        l2Amount: 0,
        poolAmount: 0,
        traderAmount: 0,
        l1Amount: 0,
      },
    };
  }

  const platformRate = Math.max(
    pickRateFromCandidates([
      row.platform_rate,
      row.admin_fee_rate,
      row.admin_rate,
      row.platform_fee_rate,
      relationship.relationshipRow?.platform_rate,
      relationship.relationshipRow?.admin_fee_rate,
      relationship.relationshipRow?.admin_rate,
    ]) ?? MIN_PLATFORM_RATE,
    MIN_PLATFORM_RATE
  );

  let l2Rate = pickRateFromCandidates([
    row.l2_rate,
    row.l2_rebate_rate,
    relationship.relationshipRow?.l2_rate,
    relationship.relationshipRow?.l2_rebate_rate,
    relationship.relationshipRow?.l2_commission_rate,
  ]);

  if (l2Rate === null && relationship.l2UserId && grossCommission > 0) {
    const derivedL2Rate = asNumber(row.l2_amount, 0) / grossCommission;
    l2Rate = derivedL2Rate >= 0 ? derivedL2Rate : null;
  }

  if (!relationship.l2UserId) {
    l2Rate = 0;
  }

  if (l2Rate === null || l2Rate < 0 || l2Rate > 1) {
    return {
      ok: false,
      error: `Unable to resolve valid l2_rate for account ${relationship.traderAccountId}.`,
    };
  }

  const platformAmount = roundForCalc(grossCommission * platformRate);
  const minimumPlatformAmount = roundForCalc(grossCommission * MIN_PLATFORM_RATE);

  if (platformAmount + CALC_EPSILON < minimumPlatformAmount) {
    return {
      ok: false,
      error: `Platform retention for account ${relationship.traderAccountId} is below 10% floor.`,
    };
  }

  const l2Amount = relationship.l2UserId ? roundForCalc(grossCommission * l2Rate) : 0;
  const poolRaw = roundForCalc(grossCommission - platformAmount - l2Amount);

  if (poolRaw < -CALC_EPSILON) {
    return {
      ok: false,
      error: `Pool is negative for account ${relationship.traderAccountId}. Gross=${grossCommission}, platform=${platformAmount}, l2=${l2Amount}.`,
    };
  }

  const poolAmount = Math.max(poolRaw, 0);

  let cSplitRate = pickRateFromCandidates([
    row.c_split_rate,
    row.trader_split_rate,
    row.trader_rate,
    relationship.relationshipRow?.c_split_rate,
    relationship.relationshipRow?.trader_split_rate,
    relationship.relationshipRow?.trader_rate,
  ]);

  if (cSplitRate === null && poolAmount > 0) {
    const derivedTraderSplit = asNumber(row.trader_amount, 0) / poolAmount;
    if (Number.isFinite(derivedTraderSplit) && derivedTraderSplit >= 0 && derivedTraderSplit <= 1) {
      cSplitRate = derivedTraderSplit;
    }
  }

  if (!relationship.l1UserId) {
    cSplitRate = 1;
  }

  if (cSplitRate === null || cSplitRate < 0 || cSplitRate > 1) {
    return {
      ok: false,
      error: `Unable to resolve valid c_split_rate for account ${relationship.traderAccountId}.`,
    };
  }

  const traderAmount = relationship.l1UserId
    ? roundForCalc(poolAmount * cSplitRate)
    : poolAmount;
  const l1Amount = relationship.l1UserId ? roundForCalc(poolAmount - traderAmount) : 0;

  if (l1Amount < -CALC_EPSILON || traderAmount < -CALC_EPSILON) {
    return {
      ok: false,
      error: `Invalid waterfall amounts for account ${relationship.traderAccountId}.`,
    };
  }

  return {
    ok: true,
    rates: {
      platformRate,
      l2Rate,
      cSplitRate,
    },
    amounts: {
      grossCommission,
      platformAmount,
      l2Amount,
      poolAmount,
      traderAmount,
      l1Amount,
    },
  };
}

function getRebateBusinessId(allocationRef: string) {
  return `REB-${allocationRef.replace(/[^A-Za-z0-9_-]/g, "-")}`;
}

function buildAllocationLines(params: {
  batchId: string;
  commissionBusinessId: string;
  relationship: RelationshipResolution;
  amounts: WaterfallAmounts;
}) {
  const allocations: AllocationLine[] = [];

  if (params.relationship.l2UserId && params.amounts.l2Amount > CALC_EPSILON) {
    const allocationRef = `${params.batchId}:${params.commissionBusinessId}:l2`;
    allocations.push({
      role: "l2",
      amount: params.amounts.l2Amount,
      beneficiaryUserId: params.relationship.l2UserId,
      allocationRef,
      rebateBusinessId: getRebateBusinessId(allocationRef),
      referenceId: allocationRef,
      ledgerRef: `LED-COMM-BATCH:${allocationRef}`,
    });
  }

  if (params.amounts.traderAmount > CALC_EPSILON) {
    const allocationRef = `${params.batchId}:${params.commissionBusinessId}:trader`;
    allocations.push({
      role: "trader",
      amount: params.amounts.traderAmount,
      beneficiaryUserId: params.relationship.traderUserId,
      allocationRef,
      rebateBusinessId: getRebateBusinessId(allocationRef),
      referenceId: allocationRef,
      ledgerRef: `LED-COMM-BATCH:${allocationRef}`,
    });
  }

  if (params.relationship.l1UserId && params.amounts.l1Amount > CALC_EPSILON) {
    const allocationRef = `${params.batchId}:${params.commissionBusinessId}:l1`;
    allocations.push({
      role: "l1",
      amount: params.amounts.l1Amount,
      beneficiaryUserId: params.relationship.l1UserId,
      allocationRef,
      rebateBusinessId: getRebateBusinessId(allocationRef),
      referenceId: allocationRef,
      ledgerRef: `LED-COMM-BATCH:${allocationRef}`,
    });
  }

  return allocations;
}

async function findExistingRebateRecord(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    rebateBusinessId: string;
    allocationRef: string;
  }
) {
  const allocationRefLookup = await supabase
    .from("rebate_records")
    .select("*")
    .eq("allocation_ref", params.allocationRef)
    .maybeSingle();

  if (!allocationRefLookup.error && allocationRefLookup.data) {
    const row = allocationRefLookup.data as Record<string, unknown>;
    const rebateId =
      asString(row.rebate_id).trim() ||
      asString(row.id).trim() ||
      params.rebateBusinessId;
    const amount =
      Number.isFinite(Number(row.amount)) ? Number(row.amount) : Number(row.rebate_amount ?? 0);
    return {
      found: true as const,
      rebateRecordId: rebateId,
      amount: Number.isFinite(amount) ? amount : 0,
      row,
    };
  }

  if (allocationRefLookup.error && !isMissingColumnError(allocationRefLookup.error.message)) {
    return {
      found: false as const,
      error: allocationRefLookup.error.message,
    };
  }

  const keyAttempts = ["rebate_id", "id"] as const;

  for (const key of keyAttempts) {
    const { data, error } = await supabase
      .from("rebate_records")
      .select("*")
      .eq(key, params.rebateBusinessId)
      .maybeSingle();

    if (!error && data) {
      const row = data as Record<string, unknown>;
      const rebateId = asString(row.rebate_id) || asString(row.id) || params.rebateBusinessId;
      const amount =
        Number.isFinite(Number(row.amount)) ? Number(row.amount) : Number(row.rebate_amount ?? 0);

      return {
        found: true as const,
        rebateRecordId: rebateId,
        amount: Number.isFinite(amount) ? amount : 0,
        row,
      };
    }

    if (error && !isMissingColumnError(error.message)) {
      return {
        found: false as const,
        error: error.message,
      };
    }
  }

  return { found: false as const };
}

async function ensureRebateRecordForApproval(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    batchId: string;
    commissionBusinessId: string;
    relationship: RelationshipResolution;
    rates: WaterfallRates;
    amounts: WaterfallAmounts;
    allocation: AllocationLine;
    commissionDate: string;
  }
): Promise<{ ok: true; rebateRecordId: string } | { ok: false; error: string }> {
  const existing = await findExistingRebateRecord(supabase, {
    rebateBusinessId: params.allocation.rebateBusinessId,
    allocationRef: params.allocation.allocationRef,
  });

  if ("error" in existing) {
    return { ok: false, error: existing.error ?? "Unable to read existing rebate record." };
  }

  if (existing.found) {
    const existingBeneficiary = asString(existing.row.beneficiary).trim();
    const existingType = asString(existing.row.rebate_type).trim().toLowerCase();

    if (Math.abs(existing.amount - params.allocation.amount) > CALC_EPSILON) {
      return {
        ok: false,
        error: `Rebate record ${existing.rebateRecordId} amount mismatch. Existing=${existing.amount}, expected=${params.allocation.amount}.`,
      };
    }

    if (
      existingBeneficiary &&
      existingBeneficiary !== params.allocation.beneficiaryUserId
    ) {
      return {
        ok: false,
        error: `Rebate record ${existing.rebateRecordId} beneficiary mismatch. Existing=${existingBeneficiary}, expected=${params.allocation.beneficiaryUserId}.`,
      };
    }

    if (existingType && existingType !== params.allocation.role) {
      return {
        ok: false,
        error: `Rebate record ${existing.rebateRecordId} rebate_type mismatch. Existing=${existingType}, expected=${params.allocation.role}.`,
      };
    }

    return { ok: true, rebateRecordId: existing.rebateRecordId };
  }

  const allocationSnapshot = {
    trader_account_id: params.relationship.traderAccountId,
    trader_user_id: params.relationship.traderUserId,
    l1_user_id: params.relationship.l1UserId,
    l2_user_id: params.relationship.l2UserId,
    relationship_snapshot_id: params.relationship.relationshipSnapshotId,
    l2_rate: params.rates.l2Rate,
    c_split_rate: params.rates.cSplitRate,
    platform_rate: params.rates.platformRate,
    gross_commission: params.amounts.grossCommission,
    platform_amount: params.amounts.platformAmount,
    l2_amount: params.amounts.l2Amount,
    pool_amount: params.amounts.poolAmount,
    trader_amount: params.amounts.traderAmount,
    l1_amount: params.amounts.l1Amount,
    commission_date: params.commissionDate,
    source_batch_id: params.batchId,
    source_commission_id: params.commissionBusinessId,
    allocation_ref: params.allocation.allocationRef,
    allocation_role: params.allocation.role,
  } satisfies Record<string, unknown>;

  const payloadAttempts: Array<Record<string, unknown>> = [
    {
      rebate_id: params.allocation.rebateBusinessId,
      beneficiary: params.allocation.beneficiaryUserId,
      account_id: params.relationship.traderAccountId,
      amount: params.allocation.amount,
      rebate_type: params.allocation.role,
      relationship_snapshot_id: params.relationship.relationshipSnapshotId,
      status: "posted",
      source_batch_id: params.batchId,
      source_commission_id: params.commissionBusinessId,
      trader_account_id: params.relationship.traderAccountId,
      trader_user_id: params.relationship.traderUserId,
      l1_user_id: params.relationship.l1UserId,
      l2_user_id: params.relationship.l2UserId,
      l2_rate: params.rates.l2Rate,
      c_split_rate: params.rates.cSplitRate,
      gross_commission: params.amounts.grossCommission,
      allocation_ref: params.allocation.allocationRef,
      allocation_snapshot: allocationSnapshot,
      created_at: new Date().toISOString(),
    },
    {
      rebate_id: params.allocation.rebateBusinessId,
      beneficiary: params.allocation.beneficiaryUserId,
      account_id: params.relationship.traderAccountId,
      amount: params.allocation.amount,
      rebate_type: params.allocation.role,
      relationship_snapshot_id: params.relationship.relationshipSnapshotId,
      status: "posted",
      source_batch_id: params.batchId,
      source_commission_id: params.commissionBusinessId,
      allocation_ref: params.allocation.allocationRef,
      created_at: new Date().toISOString(),
    },
    {
      id: params.allocation.rebateBusinessId,
      beneficiary: params.allocation.beneficiaryUserId,
      account_id: params.relationship.traderAccountId,
      amount: params.allocation.amount,
      rebate_type: params.allocation.role,
      status: "posted",
      created_at: new Date().toISOString(),
    },
  ];

  let lastErrorMessage = `Failed to create rebate record ${params.allocation.rebateBusinessId}.`;

  for (const payload of payloadAttempts) {
    const { data, error } = await supabase
      .from("rebate_records")
      .insert(payload)
      .select("*")
      .maybeSingle();

    if (!error && data) {
      const rebateRecordId =
        asString((data as Record<string, unknown>).rebate_id) ||
        asString((data as Record<string, unknown>).id) ||
        params.allocation.rebateBusinessId;
      return { ok: true, rebateRecordId };
    }

    if (error) {
      if (isUniqueViolation(error.message)) {
        const found = await findExistingRebateRecord(supabase, {
          rebateBusinessId: params.allocation.rebateBusinessId,
          allocationRef: params.allocation.allocationRef,
        });

        if ("error" in found) {
          return { ok: false, error: found.error ?? "Unable to re-check rebate record uniqueness." };
        }

        if (found.found) {
          return { ok: true, rebateRecordId: found.rebateRecordId };
        }
      }

      lastErrorMessage = error.message;

      if (!isMissingColumnError(error.message)) {
        break;
      }
    }
  }

  return { ok: false, error: lastErrorMessage };
}

async function hasExistingLedgerSettlementEntry(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ledgerRef: string,
  referenceId: string
) {
  const lookupAttempts: Array<() => Promise<{ data: unknown[] | null; error: { message: string } | null }>> = [
    async () => {
      const { data, error } = await supabase
        .from("finance_ledger")
        .select("ledger_ref")
        .eq("ledger_ref", ledgerRef)
        .limit(1);
      return { data: (data as unknown[] | null) ?? null, error };
    },
    async () => {
      const { data, error } = await supabase
        .from("finance_ledger")
        .select("reference_id")
        .eq("reference_type", COMMISSION_LEDGER_REFERENCE_TYPE)
        .eq("reference_id", referenceId)
        .limit(1);
      return { data: (data as unknown[] | null) ?? null, error };
    },
  ];

  for (const lookup of lookupAttempts) {
    const { data, error } = await lookup();

    if (!error && data && data.length > 0) {
      return { exists: true as const };
    }

    if (error && !isMissingColumnError(error.message)) {
      return { exists: false as const, error: error.message };
    }
  }

  return { exists: false as const };
}

async function insertLedgerSettlementEntry(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    batchId: string;
    commissionBusinessId: string;
    referenceId: string;
    ledgerRef: string;
    rebateRecordId: string;
    allocationRole: AllocationRole;
    beneficiaryUserId: string;
    amount: number;
    relationship: RelationshipResolution;
    rates: WaterfallRates;
    amounts: WaterfallAmounts;
    commissionDate: string;
  }
): Promise<{ ok: true; inserted: boolean } | { ok: false; error: string }> {
  const direction: "credit" | "debit" = params.amount >= 0 ? "credit" : "debit";
  const absoluteAmount = Math.abs(params.amount);
  const allocationSnapshot = {
    trader_account_id: params.relationship.traderAccountId,
    trader_user_id: params.relationship.traderUserId,
    l1_user_id: params.relationship.l1UserId,
    l2_user_id: params.relationship.l2UserId,
    relationship_snapshot_id: params.relationship.relationshipSnapshotId,
    l2_rate: params.rates.l2Rate,
    c_split_rate: params.rates.cSplitRate,
    platform_rate: params.rates.platformRate,
    gross_commission: params.amounts.grossCommission,
    platform_amount: params.amounts.platformAmount,
    l2_amount: params.amounts.l2Amount,
    pool_amount: params.amounts.poolAmount,
    trader_amount: params.amounts.traderAmount,
    l1_amount: params.amounts.l1Amount,
    commission_date: params.commissionDate,
    source_batch_id: params.batchId,
    source_commission_id: params.commissionBusinessId,
    allocation_role: params.allocationRole,
  } satisfies Record<string, unknown>;
  const payloadAttempts: Array<Record<string, unknown>> = [
    {
      ledger_ref: params.ledgerRef,
      reference_type: COMMISSION_LEDGER_REFERENCE_TYPE,
      reference_id: params.referenceId,
      entry_type: "rebate_settlement",
      transaction_type: "rebate_settlement",
      user_id: params.beneficiaryUserId,
      account_id: params.relationship.traderAccountId,
      amount: absoluteAmount,
      direction,
      status: "posted",
      trader_user_id: params.relationship.traderUserId,
      l1_ib_id: params.relationship.l1UserId,
      l2_ib_id: params.relationship.l2UserId,
      rebate_record_id: params.rebateRecordId,
      related_rebate_record: params.rebateRecordId,
      relationship_snapshot_id: params.relationship.relationshipSnapshotId,
      source_batch_id: params.batchId,
      source_commission_id: params.commissionBusinessId,
      allocation_snapshot: allocationSnapshot,
      created_at: new Date().toISOString(),
    },
    {
      ledger_ref: params.ledgerRef,
      entry_type: "rebate_settlement",
      transaction_type: "rebate_settlement",
      user_id: params.beneficiaryUserId,
      account_id: params.relationship.traderAccountId,
      amount: absoluteAmount,
      direction,
      status: "posted",
      rebate_record_id: params.rebateRecordId,
      related_rebate_record: params.rebateRecordId,
      created_at: new Date().toISOString(),
    },
    {
      ledger_ref: params.ledgerRef,
      transaction_type: "rebate_settlement",
      user_id: params.beneficiaryUserId,
      account_id: params.relationship.traderAccountId,
      amount: absoluteAmount,
      direction,
      created_at: new Date().toISOString(),
    },
    {
      ledger_ref: params.ledgerRef,
      user_id: params.beneficiaryUserId,
      amount: absoluteAmount,
      created_at: new Date().toISOString(),
    },
  ];

  let lastErrorMessage = `Failed to insert ledger settlement for ${params.referenceId}.`;

  for (const payload of payloadAttempts) {
    const { error } = await supabase.from("finance_ledger").insert(payload);

    if (!error) {
      return { ok: true, inserted: true };
    }

    if (isUniqueViolation(error.message)) {
      return { ok: true, inserted: false };
    }

    lastErrorMessage = error.message;

    if (!isMissingColumnError(error.message)) {
      break;
    }
  }

  return { ok: false, error: lastErrorMessage };
}

async function executeLiveBatchApprovalPipeline(
  supabase: Awaited<ReturnType<typeof createClient>>,
  batchId: string
): Promise<
  | {
      ok: true;
      insertedLedgerEntries: number;
      reusedLedgerEntries: number;
      createdRebateEntries: number;
      reusedRebateEntries: number;
    }
  | { ok: false; error: string }
> {
  const { data, error } = await supabase
    .from("commission_records")
    .select("*")
    .eq("batch_id", batchId);

  if (error) {
    return {
      ok: false,
      error: `Unable to load commission records for ${batchId}: ${error.message}`,
    };
  }

  const records = (data as CommissionApprovalRecordRow[] | null) ?? [];
  if (records.length === 0) {
    return {
      ok: false,
      error: `Batch ${batchId} has no commission records to settle.`,
    };
  }

  let insertedLedgerEntries = 0;
  let reusedLedgerEntries = 0;
  let createdRebateEntries = 0;
  let reusedRebateEntries = 0;
  const lookupCache: AllocationLookupCache = {
    accountByLookupKey: new Map(),
    relationshipsByAccountId: new Map(),
  };

  for (let index = 0; index < records.length; index += 1) {
    const row = records[index];
    const commissionBusinessId = getCommissionRecordBusinessId(row, index, batchId);
    const relationship = await resolveRelationshipForCommissionRecord(supabase, row, lookupCache);
    if (!relationship.ok) {
      return { ok: false, error: relationship.error };
    }

    const waterfall = computeWaterfallForRecord(row, relationship.value);
    if (!waterfall.ok) {
      return {
        ok: false,
        error: `Commission ${commissionBusinessId} failed waterfall validation: ${waterfall.error}`,
      };
    }

    if (waterfall.amounts.grossCommission <= 0) {
      continue;
    }

    const allocations = buildAllocationLines({
      batchId,
      commissionBusinessId,
      relationship: relationship.value,
      amounts: waterfall.amounts,
    });

    for (const allocation of allocations) {
      const existingRebate = await findExistingRebateRecord(supabase, {
        rebateBusinessId: allocation.rebateBusinessId,
        allocationRef: allocation.allocationRef,
      });
      if ("error" in existingRebate) {
        return { ok: false, error: existingRebate.error ?? "Unable to check existing rebate records." };
      }
      const rebateExistedBeforeWrite = existingRebate.found;

      const ensuredRebate = await ensureRebateRecordForApproval(supabase, {
        batchId,
        commissionBusinessId,
        relationship: relationship.value,
        rates: waterfall.rates,
        amounts: waterfall.amounts,
        allocation,
        commissionDate: asString(row.commission_date),
      });

      if (!ensuredRebate.ok) {
        return { ok: false, error: ensuredRebate.error };
      }

      if (rebateExistedBeforeWrite) {
        reusedRebateEntries += 1;
      } else {
        createdRebateEntries += 1;
      }

      const existingLedger = await hasExistingLedgerSettlementEntry(
        supabase,
        allocation.ledgerRef,
        allocation.referenceId
      );

      if ("error" in existingLedger) {
        return { ok: false, error: existingLedger.error ?? "Unable to check existing ledger settlement entries." };
      }

      if (existingLedger.exists) {
        reusedLedgerEntries += 1;
        continue;
      }

      const insertedLedger = await insertLedgerSettlementEntry(supabase, {
        batchId,
        commissionBusinessId,
        referenceId: allocation.referenceId,
        ledgerRef: allocation.ledgerRef,
        rebateRecordId: ensuredRebate.rebateRecordId,
        allocationRole: allocation.role,
        beneficiaryUserId: allocation.beneficiaryUserId,
        amount: allocation.amount,
        relationship: relationship.value,
        rates: waterfall.rates,
        amounts: waterfall.amounts,
        commissionDate: asString(row.commission_date),
      });

      if (!insertedLedger.ok) {
        return { ok: false, error: insertedLedger.error };
      }

      if (insertedLedger.inserted) {
        insertedLedgerEntries += 1;
      } else {
        reusedLedgerEntries += 1;
      }
    }
  }

  return {
    ok: true,
    insertedLedgerEntries,
    reusedLedgerEntries,
    createdRebateEntries,
    reusedRebateEntries,
  };
}

async function loadDownstreamEligibilitySnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  batchId: string
): Promise<{ ok: true; snapshot: DownstreamEligibilitySnapshot } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from("commission_batch_staging_rows")
    .select("mapping_status,validation_level,excluded_from_downstream,resolution_status")
    .eq("batch_id", batchId);

  if (error) {
    return {
      ok: false,
      error: isMissingColumnError(error.message)
        ? "Workflow staging columns are missing. Run migrations for validation/resolution/simulation staging first."
        : `Unable to load staging eligibility rows for ${batchId}: ${error.message}`,
    };
  }

  const rows = (data as Array<Record<string, unknown>> | null) ?? [];
  const totalRows = rows.length;
  const mappedRows = rows.filter((row) => asString(row.mapping_status).trim().toLowerCase() === "mapped").length;
  const validRows = rows.filter((row) => asString(row.validation_level).trim().toLowerCase() === "valid").length;
  const warningRows = rows.filter((row) => asString(row.validation_level).trim().toLowerCase() === "warning").length;
  const errorRows = rows.filter((row) => asString(row.validation_level).trim().toLowerCase() === "error").length;
  const resolvedRows = rows.filter(
    (row) => asString(row.resolution_status).trim().toLowerCase() === "resolved"
  ).length;
  const excludedRows = rows.filter((row) => Boolean(row.excluded_from_downstream)).length;
  const eligibleRows = rows.filter((row) => {
    const mappingStatus = asString(row.mapping_status).trim().toLowerCase();
    const validationLevel = asString(row.validation_level).trim().toLowerCase();
    const excluded = Boolean(row.excluded_from_downstream);

    return mappingStatus === "mapped" && !excluded && (validationLevel === "valid" || validationLevel === "warning");
  }).length;
  const blockedRows = rows.filter((row) => {
    const mappingStatus = asString(row.mapping_status).trim().toLowerCase();
    const validationLevel = asString(row.validation_level).trim().toLowerCase();
    const excluded = Boolean(row.excluded_from_downstream);

    if (excluded) {
      return false;
    }

    return mappingStatus !== "mapped" || validationLevel === "error";
  }).length;

  const nextRequiredAction =
    totalRows === 0
      ? "upload_rows"
      : mappedRows < totalRows
      ? "complete_mapping"
      : blockedRows > 0
      ? "resolve_and_revalidate"
      : eligibleRows === 0
      ? "review_exclusions"
      : "approval_ready";

  return {
    ok: true,
    snapshot: {
      totalRows,
      mappedRows,
      validRows,
      warningRows,
      errorRows,
      resolvedRows,
      excludedRows,
      eligibleRows,
      blockedRows,
      nextRequiredAction,
    },
  };
}

export async function confirmCommissionBatch(batchId: string): Promise<CommissionBatchWorkflowState> {
  const normalizedBatchId = normalizeBatchId(batchId);

  if (!normalizedBatchId) {
    return { error: "Batch ID is required." };
  }

  const supabase = await createClient();

  const { data: batchGate, error: batchGateError } = await supabase
    .from("commission_batches")
    .select(
      "batch_id,status,mapping_status,resolution_status,validation_result,duplicate_result,failed_rows,simulation_status,simulation_completed_at,simulation_summary"
    )
    .eq("batch_id", normalizedBatchId)
    .maybeSingle();

  if (batchGateError) {
    return {
      error: isMissingColumnError(batchGateError.message)
        ? "Workflow gate columns are missing. Run migration supabase/migrations/20260328_commission_resolution_simulation_staging.sql first."
        : `Unable to load workflow gate state for ${normalizedBatchId}: ${batchGateError.message}`,
    };
  }

  if (!batchGate) {
    return { error: `Batch ${normalizedBatchId} not found.` };
  }

  const mappingStatus = asString((batchGate as Record<string, unknown>).mapping_status).trim().toLowerCase();
  if (mappingStatus !== "mapped") {
    return {
      error: `Batch ${normalizedBatchId} mapping status is "${mappingStatus || "pending"}". Complete mapping before approval.`,
    };
  }

  const resolutionStatus = asString((batchGate as Record<string, unknown>).resolution_status).trim().toLowerCase();
  if (resolutionStatus && resolutionStatus !== "completed") {
    return {
      error: `Batch ${normalizedBatchId} resolution status is "${resolutionStatus}". Complete resolution before approval.`,
    };
  }

  const failedRows = asNumber((batchGate as Record<string, unknown>).failed_rows, 0);
  if (failedRows > 0) {
    return {
      error: `Batch ${normalizedBatchId} still has ${failedRows} blocking validation errors.`,
    };
  }

  const validationResult = asString((batchGate as Record<string, unknown>).validation_result).trim().toLowerCase();
  if (validationResult && validationResult !== "passed") {
    return {
      error: `Batch ${normalizedBatchId} validation state is "${validationResult}". Approval blocked.`,
    };
  }

  const duplicateResult = asString((batchGate as Record<string, unknown>).duplicate_result).trim().toLowerCase();
  if (duplicateResult && duplicateResult !== "clear") {
    return {
      error: `Batch ${normalizedBatchId} duplicate review is "${duplicateResult}". Approval blocked.`,
    };
  }

  const simulationStatus = asString((batchGate as Record<string, unknown>).simulation_status)
    .trim()
    .toLowerCase();
  const simulationCompletedAt = asString((batchGate as Record<string, unknown>).simulation_completed_at).trim();
  if (simulationStatus !== "completed" || !simulationCompletedAt) {
    return {
      error: `Batch ${normalizedBatchId} must complete simulation successfully before approval.`,
    };
  }

  const simulationSummary = (batchGate as Record<string, unknown>).simulation_summary;
  if (!simulationSummary || typeof simulationSummary !== "object") {
    return {
      error: `Batch ${normalizedBatchId} is missing simulation summary metadata. Rerun simulation before approval.`,
    };
  }

  const simulationSummaryRecord = simulationSummary as Record<string, unknown>;
  const simulationBlockedRows = asNumber(
    simulationSummaryRecord.blocked_rows,
    asNumber(simulationSummaryRecord.blockedRows, 0)
  );
  if (simulationBlockedRows > 0) {
    return {
      error: `Batch ${normalizedBatchId} simulation still has ${simulationBlockedRows} blocked rows. Resolve and revalidate before approval.`,
    };
  }

  const eligibilitySnapshotResult = await loadDownstreamEligibilitySnapshot(supabase, normalizedBatchId);
  if (!eligibilitySnapshotResult.ok) {
    return { error: eligibilitySnapshotResult.error };
  }

  const eligibilitySnapshot = eligibilitySnapshotResult.snapshot;
  if (eligibilitySnapshot.blockedRows > 0) {
    return {
      error: `Batch ${normalizedBatchId} still has ${eligibilitySnapshot.blockedRows} blocking staging rows (${eligibilitySnapshot.nextRequiredAction}).`,
    };
  }

  try {
    const { data, error } = await supabase.rpc("admin_confirm_commission_batch", {
      p_batch_id: normalizedBatchId,
    });

    if (error) {
      return {
        error: `Unable to confirm batch ${normalizedBatchId}: ${error.message}`,
      };
    }

    const row = (data as ConfirmCommissionBatchRpcRow[] | null)?.[0];

    if (!row) {
      return {
        error: `Unable to confirm batch ${normalizedBatchId}: transactional approval returned no result.`,
      };
    }

    const environment = normalizeBatchEnvironment(row.environment);
    const rebatesCreated = asNumber(row.rebates_created, 0);
    const rebatesReused = asNumber(row.rebates_reused, 0);
    const ledgerCreated = asNumber(row.ledger_created, 0);
    const ledgerReused = asNumber(row.ledger_reused, 0);

    const successMessage =
      environment === "test"
        ? `Batch ${normalizedBatchId} approved in test mode. Rebates created: ${rebatesCreated}, reused: ${rebatesReused}. No live ledger entries were written.`
        : `Batch ${normalizedBatchId} approved. Rebates created: ${rebatesCreated}, reused: ${rebatesReused}. Ledger inserted: ${ledgerCreated}, reused: ${ledgerReused}.`;

    revalidatePath("/admin/commission");
    revalidatePath("/admin/commission/upload");
    revalidatePath("/admin/commission/batches");
    revalidatePath(`/admin/commission/batches/${normalizedBatchId}`);

    return {
      success: successMessage,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to confirm commission batch.",
    };
  }

  return {
    error: `Failed to confirm batch ${normalizedBatchId}.`,
  };
}

export async function cancelCommissionBatch(batchId: string): Promise<CommissionBatchWorkflowState> {
  const normalizedBatchId = normalizeBatchId(batchId);

  if (!normalizedBatchId) {
    return { error: "Batch ID is required." };
  }

  try {
    const updated = await updateCommissionBatchStatus(normalizedBatchId, "cancelled");

    if (updated) {
      revalidatePath("/admin/commission");
      revalidatePath("/admin/commission/upload");
      revalidatePath("/admin/commission/batches");
      revalidatePath(`/admin/commission/batches/${normalizedBatchId}`);

      return {
        success: `Batch ${normalizedBatchId} marked as cancelled.`,
      };
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to cancel commission batch.",
    };
  }

  return {
    error: `Failed to cancel batch ${normalizedBatchId}.`,
  };
}

export async function rollbackCommissionBatch(batchId: string): Promise<CommissionBatchWorkflowState> {
  const normalizedBatchId = normalizeBatchId(batchId);

  if (!normalizedBatchId) {
    return { error: "Batch ID is required." };
  }

  try {
    const updated = await updateCommissionBatchStatus(normalizedBatchId, "rolled_back");

    if (updated) {
      revalidatePath("/admin/commission");
      revalidatePath("/admin/commission/upload");
      revalidatePath("/admin/commission/batches");
      revalidatePath(`/admin/commission/batches/${normalizedBatchId}`);

      return {
        success: `Batch ${normalizedBatchId} marked as rolled back.`,
      };
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to rollback commission batch.",
    };
  }

  return {
    error: `Failed to rollback batch ${normalizedBatchId}.`,
  };
}

export async function confirmCommissionBatchMapping(
  batchId: string
): Promise<CommissionBatchWorkflowState> {
  const normalizedBatchId = normalizeBatchId(batchId);

  if (!normalizedBatchId) {
    return { error: "Batch ID is required." };
  }

  const supabase = await createClient();
  const { data: batch, error: batchError } = await supabase
    .from("commission_batches")
    .select("batch_id,status,validation_result")
    .eq("batch_id", normalizedBatchId)
    .maybeSingle();

  if (batchError) {
    return {
      error: `Unable to load batch ${normalizedBatchId}: ${batchError.message}`,
    };
  }

  if (!batch) {
    return {
      error: `Batch ${normalizedBatchId} not found.`,
    };
  }

  const currentStatus = asString((batch as Record<string, unknown>).status).trim().toLowerCase();
  if (
    currentStatus === "confirmed" ||
    currentStatus === "locked" ||
    currentStatus === "cancelled" ||
    currentStatus === "rolled_back"
  ) {
    return {
      error: `Batch ${normalizedBatchId} is ${currentStatus} and mapping cannot be confirmed.`,
    };
  }

  const { data: validationRows, error: validationRowsError } = await supabase
    .from("commission_records")
    .select(
      "user_id,account_number,symbol,volume,commission_amount,commission_date,error,error_message,validation_error"
    )
    .eq("batch_id", normalizedBatchId);

  if (validationRowsError) {
    return {
      error: `Unable to validate commission records for ${normalizedBatchId}: ${validationRowsError.message}`,
    };
  }

  const rows = (validationRows as CommissionRecordValidationRow[] | null) ?? [];

  if (rows.length === 0) {
    return {
      error: `Batch ${normalizedBatchId} has no commission records to validate.`,
    };
  }

  const summary = buildBatchValidationSummary(rows);
  const applied = await applyBatchValidationSummary(supabase, normalizedBatchId, summary);
  if (!applied.ok) {
    return { error: applied.error };
  }

  revalidatePath("/admin/commission");
  revalidatePath("/admin/commission/upload");
  revalidatePath("/admin/commission/batches");
  revalidatePath(`/admin/commission/batches/${normalizedBatchId}`);

  if (summary.failedRows > 0) {
    return {
      error: `Mapping review recorded for ${normalizedBatchId}: ${summary.failedRows} rows failed field validation.`,
    };
  }

  if (summary.duplicateGroups > 0) {
    return {
      error: `Mapping review recorded for ${normalizedBatchId}: ${summary.duplicateGroups} duplicate groups still require review.`,
    };
  }

  return {
    success: `Mapping confirmed for ${normalizedBatchId}. Continue with duplicate review and simulation.`,
  };
}

export async function clearCommissionBatchDuplicateReview(
  batchId: string
): Promise<CommissionBatchWorkflowState> {
  const normalizedBatchId = normalizeBatchId(batchId);

  if (!normalizedBatchId) {
    return { error: "Batch ID is required." };
  }

  const supabase = await createClient();
  const { data: batch, error: batchError } = await supabase
    .from("commission_batches")
    .select("batch_id,status,duplicate_result")
    .eq("batch_id", normalizedBatchId)
    .maybeSingle();

  if (batchError) {
    return {
      error: `Unable to load batch ${normalizedBatchId}: ${batchError.message}`,
    };
  }

  if (!batch) {
    return {
      error: `Batch ${normalizedBatchId} not found.`,
    };
  }

  const currentStatus = asString((batch as Record<string, unknown>).status).trim().toLowerCase();
  if (currentStatus === "confirmed" || currentStatus === "locked") {
    return {
      error: `Batch ${normalizedBatchId} is already finalized and cannot change duplicate review state.`,
    };
  }

  const duplicateState = asString((batch as Record<string, unknown>).duplicate_result, "clear")
    .trim()
    .toLowerCase();
  if (duplicateState === "clear") {
    return {
      success: `Batch ${normalizedBatchId} duplicate review is already clear.`,
    };
  }

  const { data: duplicateRows, error: duplicateRowsError } = await supabase
    .from("commission_records")
    .select("account_number,symbol,commission_date")
    .eq("batch_id", normalizedBatchId);

  if (duplicateRowsError) {
    return {
      error: `Unable to re-check duplicate rows for ${normalizedBatchId}: ${duplicateRowsError.message}`,
    };
  }

  const duplicateGroups = countDuplicateGroups(
    (duplicateRows as CommissionRecordValidationRow[] | null) ?? []
  );
  if (duplicateGroups > 0) {
    return {
      error: `Batch ${normalizedBatchId} still has ${duplicateGroups} duplicate groups. Resolve source duplicates before clearing review state.`,
    };
  }

  const payloadAttempts: Array<Record<string, unknown>> = [
    {
      duplicate_result: "clear",
      updated_at: new Date().toISOString(),
    },
    {
      duplicate_result: "clear",
    },
  ];

  let updated = false;
  let lastErrorMessage = `Failed to update duplicate review for batch ${normalizedBatchId}.`;

  for (const payload of payloadAttempts) {
    const { data, error } = await supabase
      .from("commission_batches")
      .update(payload)
      .eq("batch_id", normalizedBatchId)
      .select("batch_id")
      .maybeSingle();

    if (!error && data) {
      updated = true;
      break;
    }

    if (error) {
      lastErrorMessage = error.message;

      if (!isMissingColumnError(error.message)) {
        break;
      }
    }
  }

  if (!updated) {
    return { error: lastErrorMessage };
  }

  revalidatePath("/admin/commission");
  revalidatePath("/admin/commission/upload");
  revalidatePath("/admin/commission/batches");
  revalidatePath(`/admin/commission/batches/${normalizedBatchId}`);

  return {
    success: `Duplicate review marked clear for ${normalizedBatchId}.`,
  };
}

export async function confirmCommissionBatchAction(
  _prevState: CommissionBatchWorkflowState,
  formData: FormData,
): Promise<CommissionBatchWorkflowState> {
  return confirmCommissionBatch(getBatchIdFromFormData(formData));
}

export async function completeCommissionBatchSimulationAction(
  _prevState: CommissionBatchWorkflowState,
  formData: FormData,
): Promise<CommissionBatchWorkflowState> {
  return completeCommissionBatchSimulation(getBatchIdFromFormData(formData));
}

export async function cancelCommissionBatchAction(
  _prevState: CommissionBatchWorkflowState,
  formData: FormData,
): Promise<CommissionBatchWorkflowState> {
  return cancelCommissionBatch(getBatchIdFromFormData(formData));
}

export async function rollbackCommissionBatchAction(
  _prevState: CommissionBatchWorkflowState,
  formData: FormData,
): Promise<CommissionBatchWorkflowState> {
  return rollbackCommissionBatch(getBatchIdFromFormData(formData));
}

export async function clearCommissionBatchDuplicateReviewAction(
  _prevState: CommissionBatchWorkflowState,
  formData: FormData
): Promise<CommissionBatchWorkflowState> {
  return clearCommissionBatchDuplicateReview(getBatchIdFromFormData(formData));
}

export async function confirmCommissionBatchMappingAction(
  _prevState: CommissionBatchWorkflowState,
  formData: FormData
): Promise<CommissionBatchWorkflowState> {
  return confirmCommissionBatchMapping(getBatchIdFromFormData(formData));
}

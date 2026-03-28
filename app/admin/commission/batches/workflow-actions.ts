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

type CommissionRecordValidationRow = Record<string, unknown>;

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

  const { data: records, error: recordsError } = await supabase
    .from("commission_records")
    .select("commission_id")
    .eq("batch_id", normalizedBatchId)
    .limit(1);

  if (recordsError) {
    return {
      error: `Unable to verify commission records for ${normalizedBatchId}: ${recordsError.message}`,
    };
  }

  if (!records || records.length === 0) {
    return {
      error: `Batch ${normalizedBatchId} has no commission records and cannot be simulation-completed.`,
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

export async function confirmCommissionBatch(batchId: string): Promise<CommissionBatchWorkflowState> {
  const normalizedBatchId = normalizeBatchId(batchId);

  if (!normalizedBatchId) {
    return { error: "Batch ID is required." };
  }

  const supabase = await createClient();

  try {
    const gate = await validateBatchReadyForApproval(supabase, normalizedBatchId);
    if (!gate.ok) {
      return { error: gate.error };
    }

    const updated = await updateCommissionBatchStatus(normalizedBatchId, "confirmed");

    if (updated) {
      revalidatePath("/admin/commission");
      revalidatePath("/admin/commission/upload");
      revalidatePath("/admin/commission/batches");
      revalidatePath(`/admin/commission/batches/${normalizedBatchId}`);

      return {
        success: `Batch ${normalizedBatchId} marked as confirmed.`,
      };
    }
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

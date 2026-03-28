"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type SettingsActionState = {
  error?: string;
  success?: string;
};

type OperationParameters = {
  batchId?: string;
  periodFrom?: string;
  periodTo?: string;
  note?: string;
};

type DbRow = Record<string, unknown>;

function normalizeOptionalValue(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : undefined;
}

function buildOperationParameters(formData: FormData): OperationParameters {
  return {
    batchId: normalizeOptionalValue(formData.get("batch_id")),
    periodFrom: normalizeOptionalValue(formData.get("period_from")),
    periodTo: normalizeOptionalValue(formData.get("period_to")),
    note: normalizeOptionalValue(formData.get("note")),
  };
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

function buildOperationSummary(operationKey: string, parameters: OperationParameters) {
  if (operationKey === "reprocessCommissionBatch") {
    return parameters.batchId ? `Batch ${parameters.batchId}` : "Batch reprocess request";
  }

  if (operationKey === "recalculateRebates") {
    if (parameters.periodFrom && parameters.periodTo) {
      return `Range ${parameters.periodFrom} -> ${parameters.periodTo}`;
    }
    return "Global rebate recalculation request";
  }

  return "Settings operation request";
}

async function insertOperationQueue(
  supabase: Awaited<ReturnType<typeof createClient>>,
  operationKey: string,
  operationTitle: string,
  linkedModule: string,
  parameters: OperationParameters
) {
  const queuePayloadAttempts: Array<Record<string, unknown>> = [
    {
      operation_key: operationKey,
      operation_title: operationTitle,
      linked_module: linkedModule || "Settings",
      status: "queued",
      parameters,
      created_by: "Admin Operator",
      created_at: new Date().toISOString(),
    },
    {
      key: operationKey,
      title: operationTitle,
      module: linkedModule || "Settings",
      state: "queued",
      payload: parameters,
      actor: "Admin Operator",
      created_at: new Date().toISOString(),
    },
  ];

  for (const payload of queuePayloadAttempts) {
    const { error } = await supabase.from("admin_operation_queue").insert(payload);
    if (!error) {
      return { ok: true };
    }
  }

  return { ok: false };
}

async function insertSettingsAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  operationKey: string,
  action: string,
  linkedModule: string,
  parameters: OperationParameters
) {
  const summary = buildOperationSummary(operationKey, parameters);

  const auditPayloadAttempts: Array<Record<string, unknown>> = [
    {
      action,
      scope: linkedModule || "Settings",
      actor: "Admin Operator",
      created_at: new Date().toISOString(),
      operation_key: operationKey,
      details: summary,
      metadata: parameters,
    },
    {
      action,
      scope: linkedModule || "Settings",
      actor: "Admin Operator",
      created_at: new Date().toISOString(),
      operation_key: operationKey,
    },
  ];

  for (const payload of auditPayloadAttempts) {
    const { error } = await supabase.from("admin_settings_audit").insert(payload);
    if (!error) {
      return { ok: true };
    }
  }

  return { ok: false };
}

function validateOperationInputs(operationKey: string, parameters: OperationParameters): string | null {
  if (operationKey === "reprocessCommissionBatch" && !parameters.batchId) {
    return "Batch ID is required for reprocessing commission batches.";
  }

  if (
    operationKey === "recalculateRebates" &&
    ((parameters.periodFrom && !parameters.periodTo) || (!parameters.periodFrom && parameters.periodTo))
  ) {
    return "Please provide both start and end date for rebate recalculation range.";
  }

  return null;
}

async function updateBatchForReprocess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  batchId: string
) {
  const now = new Date().toISOString();
  const payloadAttempts: Array<Record<string, unknown>> = [
    {
      status: "validated",
      simulation_status: "pending",
      simulation_completed_at: null,
      updated_at: now,
    },
    {
      status: "validated",
      updated_at: now,
    },
    {
      status: "validated",
    },
  ];

  for (const payload of payloadAttempts) {
    const { data, error } = await supabase
      .from("commission_batches")
      .update(payload)
      .eq("batch_id", batchId)
      .select("batch_id")
      .maybeSingle();

    if (!error && data) {
      return { ok: true };
    }

    if (error && !isMissingColumnError(error.message)) {
      return { ok: false, error: error.message };
    }
  }

  return { ok: false, error: "Unable to update commission batch for reprocess." };
}

async function updateBatchRecordsForReprocess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  batchId: string
) {
  const now = new Date().toISOString();
  const payloadAttempts: Array<Record<string, unknown>> = [
    { status: "imported", updated_at: now },
    { status: "imported" },
  ];

  for (const payload of payloadAttempts) {
    const { error } = await supabase.from("commission_records").update(payload).eq("batch_id", batchId);

    if (!error) {
      return { ok: true };
    }

    if (!isMissingColumnError(error.message)) {
      return { ok: false, error: error.message };
    }
  }

  return { ok: false, error: "Unable to reset commission record status for reprocess." };
}

async function executeReprocessCommissionBatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  parameters: OperationParameters
) {
  const batchId = parameters.batchId;
  if (!batchId) {
    return { ok: false, error: "Batch ID is required for reprocess execution." };
  }

  const { data: batch, error: batchError } = await supabase
    .from("commission_batches")
    .select("batch_id,status")
    .eq("batch_id", batchId)
    .maybeSingle();

  if (batchError) {
    return { ok: false, error: `Unable to load batch ${batchId}: ${batchError.message}` };
  }

  if (!batch) {
    return { ok: false, error: `Batch ${batchId} does not exist.` };
  }

  const currentStatus = asString((batch as DbRow).status).trim().toLowerCase();
  if (currentStatus === "locked") {
    return { ok: false, error: `Batch ${batchId} is locked and cannot be reprocessed.` };
  }

  const batchUpdated = await updateBatchForReprocess(supabase, batchId);
  if (!batchUpdated.ok) {
    return { ok: false, error: batchUpdated.error };
  }

  const recordsUpdated = await updateBatchRecordsForReprocess(supabase, batchId);
  if (!recordsUpdated.ok) {
    return { ok: false, error: recordsUpdated.error };
  }

  return {
    ok: true,
    message: `Batch ${batchId} has been reset to validated status with simulation pending.`,
  };
}

async function updateSingleRebateRecord(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rebateRecordId: string,
  amount: number
) {
  const payloadAttempts: Array<Record<string, unknown>> = [
    { amount, updated_at: new Date().toISOString() },
    { rebate_amount: amount, updated_at: new Date().toISOString() },
    { amount },
    { rebate_amount: amount },
  ];
  const keyAttempts = ["rebate_id", "id"] as const;

  for (const key of keyAttempts) {
    for (const payload of payloadAttempts) {
      const { data, error } = await supabase
        .from("rebate_records")
        .update(payload)
        .eq(key, rebateRecordId)
        .select(key)
        .maybeSingle();

      if (!error && data) {
        return { ok: true };
      }

      if (error && !isMissingColumnError(error.message)) {
        return { ok: false, error: error.message };
      }
    }
  }

  return { ok: false, error: `Unable to update rebate record ${rebateRecordId}.` };
}

async function executeRecalculateRebates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  parameters: OperationParameters
) {
  let query = supabase
    .from("commission_records")
    .select("rebate_record_id, rebate_amount, commission_date");

  if (parameters.periodFrom) {
    query = query.gte("commission_date", parameters.periodFrom);
  }

  if (parameters.periodTo) {
    query = query.lte("commission_date", parameters.periodTo);
  }

  const { data, error } = await query;
  if (error) {
    return { ok: false, error: `Unable to read commission records: ${error.message}` };
  }

  const rows = (data as DbRow[] | null) ?? [];
  const aggregated = new Map<string, number>();
  for (const row of rows) {
    const rebateRecordId = asString(row.rebate_record_id).trim();
    if (!rebateRecordId) {
      continue;
    }

    const rebateAmount = asNumber(row.rebate_amount, 0);
    aggregated.set(rebateRecordId, (aggregated.get(rebateRecordId) ?? 0) + rebateAmount);
  }

  if (aggregated.size === 0) {
    return { ok: true, message: "No rebate-linked commission records found for recalculation." };
  }

  let successCount = 0;
  for (const [rebateRecordId, amount] of aggregated.entries()) {
    const updated = await updateSingleRebateRecord(supabase, rebateRecordId, amount);
    if (updated.ok) {
      successCount += 1;
    }
  }

  if (successCount === 0) {
    return { ok: false, error: "No rebate records were updated during recalculation." };
  }

  return {
    ok: true,
    message: `Recalculated ${successCount} rebate records from commission record aggregates.`,
  };
}

async function executeSettingsOperation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  operationKey: string,
  parameters: OperationParameters
) {
  if (operationKey === "reprocessCommissionBatch") {
    return executeReprocessCommissionBatch(supabase, parameters);
  }

  if (operationKey === "recalculateRebates") {
    return executeRecalculateRebates(supabase, parameters);
  }

  return {
    ok: true,
    message: "Operation metadata recorded. No direct execution handler is required for this action.",
  };
}

export async function runSettingsOperationAction(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const operationKey = String(formData.get("operation_key") ?? "").trim();
  const operationTitle = String(formData.get("operation_title") ?? "").trim();
  const linkedModule = String(formData.get("linked_module") ?? "").trim();
  const parameters = buildOperationParameters(formData);

  if (!operationKey || !operationTitle) {
    return { error: "Operation metadata is required." };
  }

  const validationError = validateOperationInputs(operationKey, parameters);
  if (validationError) {
    return { error: validationError };
  }

  try {
    const supabase = await createClient();
    await insertOperationQueue(supabase, operationKey, operationTitle, linkedModule, parameters);
    await insertSettingsAudit(
      supabase,
      operationKey,
      `Queued ${operationTitle}`,
      linkedModule,
      parameters
    );

    const executed = await executeSettingsOperation(supabase, operationKey, parameters);
    if (!executed.ok) {
      await insertSettingsAudit(
        supabase,
        operationKey,
        `Failed ${operationTitle}`,
        linkedModule,
        parameters
      );
      return { error: executed.error };
    }

    await insertSettingsAudit(
      supabase,
      operationKey,
      `Executed ${operationTitle}`,
      linkedModule,
      parameters
    );
    revalidatePath("/admin/settings");
    revalidatePath("/admin/commission");
    revalidatePath("/admin/commission/batches");
    revalidatePath("/admin/finance");

    return {
      success: executed.message,
    };
  } catch {
    return { error: "Operation execution failed due to a backend exception." };
  }
}

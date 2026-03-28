"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type AdjustmentActionState = {
  error?: string;
  success?: string;
};

type AdjustmentType = "credit" | "debit";

const ADJUSTMENTS_PATH = "/admin/finance/adjustments";
const LEDGER_PATH = "/admin/finance/ledger";
const FINANCE_PATH = "/admin/finance";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parsePositiveAmount(rawAmount: string) {
  const parsed = Number(rawAmount);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function normalizeAdjustmentType(rawType: string): AdjustmentType | null {
  const normalized = rawType.trim().toLowerCase();

  if (normalized === "credit" || normalized === "debit") {
    return normalized;
  }

  return null;
}

function isMissingColumnError(message: string) {
  return /column .* does not exist/i.test(message);
}

function revalidateAdjustmentSurfaces() {
  revalidatePath(ADJUSTMENTS_PATH);
  revalidatePath(LEDGER_PATH);
  revalidatePath(FINANCE_PATH);
}

async function writeAdjustmentAuditLog({
  action,
  operationKey,
  details,
}: {
  action: string;
  operationKey: string;
  details: string;
}) {
  try {
    const supabase = await createClient();
    const baseRow = {
      action,
      scope: "Finance / Adjustments",
      actor: "Admin Operator",
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("admin_settings_audit").insert({
      ...baseRow,
      operation_key: operationKey,
      details,
    });

    if (error) {
      await supabase.from("admin_settings_audit").insert(baseRow);
    }
  } catch {
    // Keep finance mutation flow usable even when optional audit logging is unavailable.
  }
}

async function resolveUserIdByAccountId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accountId: string
) {
  for (const key of ["account_id", "id"] as const) {
    const { data, error } = await supabase
      .from("trading_accounts")
      .select("user_id")
      .eq(key, accountId)
      .maybeSingle();

    if (!error && data && typeof data.user_id === "string" && data.user_id.trim()) {
      return data.user_id.trim();
    }

    if (error && !isMissingColumnError(error.message)) {
      return null;
    }
  }

  return null;
}

async function resolveAdjustmentTarget(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  accountId: string
) {
  if (userId) {
    return {
      userId,
      accountId: accountId || null,
    };
  }

  if (!accountId) {
    return null;
  }

  const resolvedUserId = await resolveUserIdByAccountId(supabase, accountId);

  if (!resolvedUserId) {
    return null;
  }

  return {
    userId: resolvedUserId,
    accountId,
  };
}

async function getCurrentBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from("finance_ledger")
    .select("amount,direction")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce((sum, row) => {
    const amount = Number(row.amount ?? 0);
    const direction =
      typeof row.direction === "string" ? row.direction.trim().toLowerCase() : "";

    if (direction === "debit") {
      return sum - Math.abs(amount);
    }

    if (direction === "credit") {
      return sum + Math.abs(amount);
    }

    return sum + amount;
  }, 0);
}

async function insertFinanceLedgerAdjustment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    userId: string;
    accountId: string | null;
    adjustmentType: AdjustmentType;
    amount: number;
    reason: string;
    operator: string;
  }
) {
  const signedAmount = params.adjustmentType === "credit" ? params.amount : -params.amount;
  const currentBalance = await getCurrentBalance(supabase, params.userId);
  const balanceAfter = currentBalance + signedAmount;
  const payloadAttempts: Array<Record<string, unknown>> = [
    {
      user_id: params.userId,
      account_id: params.accountId,
      entry_type: "adjustment",
      transaction_type: "adjustment",
      amount: signedAmount,
      direction: params.adjustmentType,
      status: "posted",
      reason: params.reason,
      operator: params.operator,
      balance_after: balanceAfter,
      created_at: new Date().toISOString(),
    },
    {
      user_id: params.userId,
      account_id: params.accountId,
      transaction_type: "adjustment",
      amount: signedAmount,
      balance_after: balanceAfter,
      created_at: new Date().toISOString(),
    },
    {
      user_id: params.userId,
      transaction_type: "adjustment",
      amount: signedAmount,
      created_at: new Date().toISOString(),
    },
    {
      user_id: params.userId,
      entry_type: "adjustment",
      amount: signedAmount,
      created_at: new Date().toISOString(),
    },
  ];

  let lastError = "Unable to write finance ledger adjustment.";

  for (const payload of payloadAttempts) {
    const { error } = await supabase.from("finance_ledger").insert(payload);

    if (!error) {
      return { ok: true as const };
    }

    lastError = error.message;

    if (!isMissingColumnError(error.message)) {
      break;
    }
  }

  return { ok: false as const, error: lastError };
}

export async function queueSingleAdjustmentAction(
  _prevState: AdjustmentActionState,
  formData: FormData
): Promise<AdjustmentActionState> {
  const adjustmentType = normalizeAdjustmentType(getFormString(formData, "adjustment_type"));
  const userId = getFormString(formData, "user_id");
  const accountId = getFormString(formData, "account_id");
  const amountText = getFormString(formData, "amount");
  const reason = getFormString(formData, "reason");

  if (!adjustmentType) {
    return { error: "Please choose a valid adjustment type (credit or debit)." };
  }

  const amount = parsePositiveAmount(amountText);
  if (amount === null) {
    return { error: "Please enter a valid amount greater than zero." };
  }

  if (reason.length < 6) {
    return { error: "Please provide an adjustment reason with at least 6 characters." };
  }

  const supabase = await createClient();
  const target = await resolveAdjustmentTarget(supabase, userId, accountId);

  if (!target) {
    return {
      error:
        "A valid user_id or account_id is required. If only account_id is provided, it must map to trading_accounts.user_id.",
    };
  }

  const posted = await insertFinanceLedgerAdjustment(supabase, {
    userId: target.userId,
    accountId: target.accountId,
    adjustmentType,
    amount,
    reason,
    operator: "Admin Operator",
  });

  if (!posted.ok) {
    return { error: posted.error };
  }

  await writeAdjustmentAuditLog({
    action: `Posted ${adjustmentType} adjustment`,
    operationKey: "finance_adjustment_single",
    details: JSON.stringify({
      userId: target.userId,
      accountId: target.accountId,
      adjustmentType,
      amount,
      reason,
    }),
  });

  revalidateAdjustmentSurfaces();

  return {
    success: `${adjustmentType === "credit" ? "Credit" : "Debit"} adjustment posted for ${
      target.accountId || target.userId
    } at $${amount.toFixed(2)}.`,
  };
}

type BatchAdjustmentEntry = {
  user_id?: string;
  account_id?: string;
  adjustment_type?: string;
  amount?: number;
  reason?: string;
};

function parseBatchEntries(rawEntries: string) {
  try {
    const parsed = JSON.parse(rawEntries) as unknown;

    if (!Array.isArray(parsed)) {
      return { error: "Entries JSON must be an array." as const };
    }

    return { entries: parsed as BatchAdjustmentEntry[] };
  } catch {
    return { error: "Entries JSON is invalid." as const };
  }
}

export async function queueBatchAdjustmentAction(
  _prevState: AdjustmentActionState,
  formData: FormData
): Promise<AdjustmentActionState> {
  const batchReference = getFormString(formData, "batch_reference");
  const reason = getFormString(formData, "reason");
  const rawEntries = getFormString(formData, "entries_json");

  if (!batchReference) {
    return { error: "Batch reference is required for batch adjustment execution." };
  }

  if (reason.length < 6) {
    return { error: "Please provide a batch reason with at least 6 characters." };
  }

  const parsedEntries = parseBatchEntries(rawEntries);

  if ("error" in parsedEntries) {
    return { error: parsedEntries.error };
  }

  if (parsedEntries.entries.length === 0) {
    return { error: "Entries JSON must include at least one adjustment row." };
  }

  const supabase = await createClient();
  let successCount = 0;
  const errors: string[] = [];

  for (let index = 0; index < parsedEntries.entries.length; index += 1) {
    const item = parsedEntries.entries[index];
    const itemType = normalizeAdjustmentType(String(item.adjustment_type ?? ""));
    const itemAmount = parsePositiveAmount(String(item.amount ?? ""));
    const itemReason = String(item.reason ?? "").trim() || reason;
    const itemUserId = String(item.user_id ?? "").trim();
    const itemAccountId = String(item.account_id ?? "").trim();

    if (!itemType || itemAmount === null) {
      errors.push(`Row ${index + 1}: invalid adjustment_type or amount.`);
      continue;
    }

    const target = await resolveAdjustmentTarget(supabase, itemUserId, itemAccountId);

    if (!target) {
      errors.push(`Row ${index + 1}: missing valid user/account target.`);
      continue;
    }

    const posted = await insertFinanceLedgerAdjustment(supabase, {
      userId: target.userId,
      accountId: target.accountId,
      adjustmentType: itemType,
      amount: itemAmount,
      reason: itemReason,
      operator: `Batch ${batchReference}`,
    });

    if (!posted.ok) {
      errors.push(`Row ${index + 1}: ${posted.error}`);
      continue;
    }

    successCount += 1;
  }

  await writeAdjustmentAuditLog({
    action: "Executed batch adjustment",
    operationKey: "finance_adjustment_batch",
    details: JSON.stringify({
      batchReference,
      reason,
      totalRows: parsedEntries.entries.length,
      successCount,
      errorCount: errors.length,
    }),
  });

  revalidateAdjustmentSurfaces();

  if (errors.length > 0) {
    return {
      error: `Batch ${batchReference} completed with ${successCount}/${parsedEntries.entries.length} success. First error: ${errors[0]}`,
    };
  }

  return {
    success: `Batch ${batchReference} executed successfully (${successCount} adjustments posted).`,
  };
}

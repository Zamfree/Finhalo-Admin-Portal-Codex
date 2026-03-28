"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type WithdrawalActionState = {
  error?: string;
  success?: string;
};

const WITHDRAWALS_PATH = "/admin/finance/withdrawals";
const SUPPORTED_CONTEXT_KEYS = ["user_id", "status", "from_date", "to_date"] as const;

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function buildContextQuery(formData: FormData): URLSearchParams {
  const params = new URLSearchParams();

  for (const key of SUPPORTED_CONTEXT_KEYS) {
    const value = getFormString(formData, key);
    if (value) {
      params.set(key, value);
    }
  }

  return params;
}

function revalidateWithdrawalsWithContext(formData: FormData) {
  revalidatePath(WITHDRAWALS_PATH);

  const contextParams = buildContextQuery(formData);
  const contextQueryString = contextParams.toString();

  if (contextQueryString) {
    revalidatePath(`${WITHDRAWALS_PATH}?${contextQueryString}`);
  }
}

async function getCurrentBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number> {
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

export async function approveWithdrawalAction(
  _prevState: WithdrawalActionState,
  formData: FormData,
): Promise<WithdrawalActionState> {
  const withdrawalId = getFormString(formData, "withdrawal_id");

  if (!withdrawalId) {
    return { error: "Unable to approve withdrawal: missing withdrawal ID." };
  }

  const supabase = await createClient();
  return approveWithdrawalById(supabase, withdrawalId);
}

async function approveWithdrawalById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  withdrawalId: string,
): Promise<WithdrawalActionState> {
  const formData = new FormData();
  formData.set("withdrawal_id", withdrawalId);

  const { data: withdrawal, error: withdrawalError } = await supabase
    .from("withdrawals")
    .select("id,user_id,amount,status")
    .eq("id", withdrawalId)
    .maybeSingle();

  if (withdrawalError) {
    return { error: `Unable to approve withdrawal ${withdrawalId}: ${withdrawalError.message}` };
  }

  if (!withdrawal) {
    return { error: `Unable to approve withdrawal ${withdrawalId}: withdrawal not found.` };
  }

  if (withdrawal.status !== "pending") {
    return {
      error: `Unable to approve withdrawal ${withdrawalId}: current status is "${withdrawal.status}". Only pending withdrawals can be approved.`,
    };
  }

  const userId = String(withdrawal.user_id ?? "").trim();
  if (!userId) {
    return { error: `Unable to approve withdrawal ${withdrawalId}: missing user_id.` };
  }

  const withdrawalAmount = Number(withdrawal.amount);
  if (!Number.isFinite(withdrawalAmount) || withdrawalAmount <= 0) {
    return { error: `Unable to approve withdrawal ${withdrawalId}: invalid withdrawal amount.` };
  }

  const currentBalance = await getCurrentBalance(supabase, userId);
  const ledgerAmount = -Math.abs(withdrawalAmount);
  const balanceAfter = currentBalance + ledgerAmount;

  const { error: updateError } = await supabase
    .from("withdrawals")
    .update({ status: "approved" })
    .eq("id", withdrawalId);

  if (updateError) {
    return { error: `Unable to approve withdrawal ${withdrawalId}: ${updateError.message}` };
  }

  const { error: ledgerError } = await supabase.from("finance_ledger").insert({
    user_id: userId,
    transaction_type: "withdrawal",
    amount: ledgerAmount,
    balance_after: balanceAfter,
  });

  if (ledgerError) {
    await supabase.from("withdrawals").update({ status: "pending" }).eq("id", withdrawalId);

    return {
      error: `Withdrawal ${withdrawalId} status was reverted to pending because ledger insertion failed: ${ledgerError.message}`,
    };
  }

  revalidateWithdrawalsWithContext(formData);
  revalidatePath("/admin/finance");

  return {
    success: `Withdrawal ${withdrawalId} approved for user ${userId}. Ledger updated by ${Math.abs(ledgerAmount).toLocaleString()}.`,
  };
}

export async function rejectWithdrawalAction(
  _prevState: WithdrawalActionState,
  formData: FormData,
): Promise<WithdrawalActionState> {
  const withdrawalId = getFormString(formData, "withdrawal_id");

  if (!withdrawalId) {
    return { error: "Unable to reject withdrawal: missing withdrawal ID." };
  }

  const supabase = await createClient();
  return rejectWithdrawalById(supabase, withdrawalId);
}

async function rejectWithdrawalById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  withdrawalId: string,
): Promise<WithdrawalActionState> {
  const formData = new FormData();
  formData.set("withdrawal_id", withdrawalId);

  const { data: withdrawal, error: lookupError } = await supabase
    .from("withdrawals")
    .select("id,status")
    .eq("id", withdrawalId)
    .maybeSingle();

  if (lookupError) {
    return { error: `Unable to reject withdrawal ${withdrawalId}: ${lookupError.message}` };
  }

  if (!withdrawal) {
    return { error: `Unable to reject withdrawal ${withdrawalId}: withdrawal not found.` };
  }

  if (withdrawal.status !== "pending") {
    return {
      error: `Unable to reject withdrawal ${withdrawalId}: current status is "${withdrawal.status}". Only pending withdrawals can be rejected.`,
    };
  }

  const { error } = await supabase.from("withdrawals").update({ status: "rejected" }).eq("id", withdrawalId);

  if (error) {
    return { error: `Unable to reject withdrawal ${withdrawalId}: ${error.message}` };
  }

  revalidateWithdrawalsWithContext(formData);

  return { success: `Withdrawal ${withdrawalId} rejected.` };
}

async function getPendingWithdrawalIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<{ ids: string[]; error?: string }> {
  const { data, error } = await supabase
    .from("withdrawals")
    .select("id,status")
    .eq("status", "pending");

  if (error) {
    return { ids: [], error: error.message };
  }

  return {
    ids: (data ?? [])
      .map((row) => String(row.id ?? "").trim())
      .filter((id) => id.length > 0),
  };
}

export async function batchApproveWithdrawalsAction(
  _prevState: WithdrawalActionState,
  _formData: FormData,
): Promise<WithdrawalActionState> {
  void _formData;
  const supabase = await createClient();
  const pending = await getPendingWithdrawalIds(supabase);

  if (pending.error) {
    return { error: `Unable to load pending withdrawals: ${pending.error}` };
  }

  if (pending.ids.length === 0) {
    return { error: "No pending withdrawals available for batch approval." };
  }

  let approvedCount = 0;
  const errors: string[] = [];

  for (const withdrawalId of pending.ids) {
    const result = await approveWithdrawalById(supabase, withdrawalId);

    if (result.success) {
      approvedCount += 1;
      continue;
    }

    if (result.error) {
      errors.push(result.error);
    }
  }

  revalidatePath(WITHDRAWALS_PATH);
  revalidatePath("/admin/finance");

  if (errors.length > 0) {
    return {
      error: `Batch approve finished with partial success. Approved ${approvedCount}/${pending.ids.length}. First error: ${errors[0]}`,
    };
  }

  return {
    success: `Batch approve completed. Approved ${approvedCount} withdrawals.`,
  };
}

export async function batchRejectWithdrawalsAction(
  _prevState: WithdrawalActionState,
  _formData: FormData,
): Promise<WithdrawalActionState> {
  void _formData;
  const supabase = await createClient();
  const pending = await getPendingWithdrawalIds(supabase);

  if (pending.error) {
    return { error: `Unable to load pending withdrawals: ${pending.error}` };
  }

  if (pending.ids.length === 0) {
    return { error: "No pending withdrawals available for batch reject." };
  }

  let rejectedCount = 0;
  const errors: string[] = [];

  for (const withdrawalId of pending.ids) {
    const result = await rejectWithdrawalById(supabase, withdrawalId);

    if (result.success) {
      rejectedCount += 1;
      continue;
    }

    if (result.error) {
      errors.push(result.error);
    }
  }

  revalidatePath(WITHDRAWALS_PATH);
  revalidatePath("/admin/finance");

  if (errors.length > 0) {
    return {
      error: `Batch reject finished with partial success. Rejected ${rejectedCount}/${pending.ids.length}. First error: ${errors[0]}`,
    };
  }

  return {
    success: `Batch reject completed. Rejected ${rejectedCount} withdrawals.`,
  };
}

export async function updateWithdrawalGasFeeAction(
  _prevState: WithdrawalActionState,
  formData: FormData,
): Promise<WithdrawalActionState> {
  const rawFee = getFormString(formData, "gas_fee");
  const network = getFormString(formData, "network");
  const fee = Number(rawFee);

  if (!Number.isFinite(fee) || fee < 0) {
    return { error: "Gas fee must be a valid non-negative number." };
  }

  const supabase = await createClient();
  let query = supabase.from("withdrawals").update({ fee });

  if (network) {
    query = query.eq("network", network);
  }

  const { error } = await query.eq("status", "pending");

  if (error) {
    return { error: `Unable to update gas fee: ${error.message}` };
  }

  revalidatePath(WITHDRAWALS_PATH);
  revalidatePath("/admin/finance");

  return {
    success: `Gas fee updated to ${fee.toFixed(2)}${network ? ` for ${network}` : ""} on pending withdrawals.`,
  };
}

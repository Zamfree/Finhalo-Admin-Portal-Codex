"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer } from "@/lib/supabase/server";

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

async function getCurrentBalance(userId: string): Promise<number> {
  const { data, error } = await supabaseServer
    .from("finance_ledger")
    .select("amount")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
}

export async function approveWithdrawalAction(
  _prevState: WithdrawalActionState,
  formData: FormData,
): Promise<WithdrawalActionState> {
  const withdrawalId = getFormString(formData, "withdrawal_id");

  if (!withdrawalId) {
    return { error: "Unable to approve withdrawal: missing withdrawal ID." };
  }

  const { data: withdrawal, error: withdrawalError } = await supabaseServer
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

  const currentBalance = await getCurrentBalance(userId);
  const ledgerAmount = -Math.abs(withdrawalAmount);
  const balanceAfter = currentBalance + ledgerAmount;

  const { error: updateError } = await supabaseServer
    .from("withdrawals")
    .update({ status: "approved" })
    .eq("id", withdrawalId);

  if (updateError) {
    return { error: `Unable to approve withdrawal ${withdrawalId}: ${updateError.message}` };
  }

  const { error: ledgerError } = await supabaseServer.from("finance_ledger").insert({
    user_id: userId,
    transaction_type: "withdrawal",
    amount: ledgerAmount,
    balance_after: balanceAfter,
  });

  if (ledgerError) {
    await supabaseServer.from("withdrawals").update({ status: "pending" }).eq("id", withdrawalId);

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

  const { data: withdrawal, error: lookupError } = await supabaseServer
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

  const { error } = await supabaseServer.from("withdrawals").update({ status: "rejected" }).eq("id", withdrawalId);

  if (error) {
    return { error: `Unable to reject withdrawal ${withdrawalId}: ${error.message}` };
  }

  revalidateWithdrawalsWithContext(formData);

  return { success: `Withdrawal ${withdrawalId} rejected.` };
}

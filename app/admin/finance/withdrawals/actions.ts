"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type WithdrawalActionState = {
  error?: string;
  success?: string;
};

async function getCurrentBalance(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("finance_ledger").select("amount").eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
}

export async function approveWithdrawalAction(
  _prevState: WithdrawalActionState,
  formData: FormData,
): Promise<WithdrawalActionState> {
  const withdrawalId = String(formData.get("withdrawal_id") ?? "").trim();

  if (!withdrawalId) {
    return { error: "Withdrawal ID is required." };
  }

  const supabase = await createClient();

  const { data: withdrawal, error: withdrawalError } = await supabase
    .from("withdrawals")
    .select("id,user_id,amount,status")
    .eq("id", withdrawalId)
    .maybeSingle();

  if (withdrawalError) {
    return { error: withdrawalError.message };
  }

  if (!withdrawal) {
    return { error: "Withdrawal not found." };
  }

  if (withdrawal.status !== "pending") {
    return { error: "Only pending withdrawals can be approved." };
  }

  const currentBalance = await getCurrentBalance(withdrawal.user_id);
  const ledgerAmount = -Math.abs(Number(withdrawal.amount));
  const balanceAfter = currentBalance + ledgerAmount;

  const { error: updateError } = await supabase.from("withdrawals").update({ status: "approved" }).eq("id", withdrawalId);

  if (updateError) {
    return { error: updateError.message };
  }

  const { error: ledgerError } = await supabase.from("finance_ledger").insert({
    user_id: withdrawal.user_id,
    transaction_type: "withdrawal",
    amount: ledgerAmount,
    balance_after: balanceAfter,
  });

  if (ledgerError) {
    return { error: ledgerError.message };
  }

  revalidatePath("/admin/finance/withdrawals");
  revalidatePath("/admin/finance");

  return { success: `Withdrawal ${withdrawalId} approved.` };
}

export async function rejectWithdrawalAction(
  _prevState: WithdrawalActionState,
  formData: FormData,
): Promise<WithdrawalActionState> {
  const withdrawalId = String(formData.get("withdrawal_id") ?? "").trim();

  if (!withdrawalId) {
    return { error: "Withdrawal ID is required." };
  }

  const supabase = await createClient();

  const { data: withdrawal, error: lookupError } = await supabase
    .from("withdrawals")
    .select("id,status")
    .eq("id", withdrawalId)
    .maybeSingle();

  if (lookupError) {
    return { error: lookupError.message };
  }

  if (!withdrawal) {
    return { error: "Withdrawal not found." };
  }

  if (withdrawal.status !== "pending") {
    return { error: "Only pending withdrawals can be rejected." };
  }

  const { error } = await supabase.from("withdrawals").update({ status: "rejected" }).eq("id", withdrawalId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/finance/withdrawals");

  return { success: `Withdrawal ${withdrawalId} rejected.` };
}

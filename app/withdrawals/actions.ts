"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ClientWithdrawalActionState = {
  error?: string;
  success?: string;
  withdrawalId?: string;
  availableAfter?: number;
};

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseFormNumber(formData: FormData, key: string) {
  const parsed = Number(getFormString(formData, key));
  return Number.isFinite(parsed) ? parsed : NaN;
}

export async function createWithdrawalRequestAction(
  _prevState: ClientWithdrawalActionState,
  formData: FormData
): Promise<ClientWithdrawalActionState> {
  const accountId = getFormString(formData, "account_id") || null;
  const requestAmount = parseFormNumber(formData, "request_amount");
  const feeAmount = parseFormNumber(formData, "fee_amount");
  const currency = getFormString(formData, "currency") || "USD";
  const walletAddress = getFormString(formData, "wallet_address");
  const payoutMethod = getFormString(formData, "payout_method") || "wallet_transfer";
  const idempotencyKey = getFormString(formData, "idempotency_key") || null;

  if (!Number.isFinite(requestAmount) || requestAmount <= 0) {
    return { error: "Please enter a valid request amount greater than 0." };
  }

  if (!Number.isFinite(feeAmount) || feeAmount < 0) {
    return { error: "Fee amount must be a valid non-negative number." };
  }

  if (!walletAddress) {
    return { error: "Wallet address is required." };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;

  if (!userId) {
    return { error: "Please sign in before requesting a withdrawal." };
  }

  const { data, error } = await supabase.rpc("client_create_withdrawal_request", {
    p_user_id: userId,
    p_account_id: accountId,
    p_request_amount: requestAmount,
    p_fee_amount: feeAmount,
    p_currency: currency,
    p_wallet_address: walletAddress,
    p_payout_method: payoutMethod,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    return { error: `Unable to create withdrawal request: ${error.message}` };
  }

  const firstRow = Array.isArray(data) ? (data[0] as Record<string, unknown> | undefined) : undefined;
  const withdrawalId =
    typeof firstRow?.withdrawal_id === "string" ? firstRow.withdrawal_id : undefined;
  const availableAfter = Number(firstRow?.available_after ?? 0);

  revalidatePath("/withdrawals");
  revalidatePath("/admin/finance/withdrawals");
  revalidatePath("/admin/finance/ledger");

  return {
    success: withdrawalId
      ? `Withdrawal request submitted: ${withdrawalId}.`
      : "Withdrawal request submitted.",
    withdrawalId,
    availableAfter: Number.isFinite(availableAfter) ? availableAfter : undefined,
  };
}

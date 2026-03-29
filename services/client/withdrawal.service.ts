import type { ClientWithdrawalHistoryRow, ClientWithdrawalWorkspace } from "@/app/withdrawals/_types";
import { createClient } from "@/lib/supabase/server";

type DbRow = Record<string, unknown>;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapStatus(value: unknown): ClientWithdrawalHistoryRow["status"] {
  const normalized = asString(value).trim().toLowerCase();
  if (
    normalized === "requested" ||
    normalized === "under_review" ||
    normalized === "approved" ||
    normalized === "rejected" ||
    normalized === "processing" ||
    normalized === "completed" ||
    normalized === "failed" ||
    normalized === "cancelled"
  ) {
    return normalized;
  }

  if (normalized === "pending") {
    return "requested";
  }

  return "requested";
}

function mapHistoryRow(row: DbRow): ClientWithdrawalHistoryRow | null {
  const withdrawalId = asString(row.withdrawal_id) || asString(row.id);
  if (!withdrawalId) {
    return null;
  }

  const requestAmount = Math.abs(asNumber(row.request_amount, asNumber(row.amount)));
  const feeAmount = Math.abs(asNumber(row.fee_amount, asNumber(row.fee)));
  const netAmount = Math.max(0, asNumber(row.net_amount, requestAmount - feeAmount));

  return {
    withdrawal_id: withdrawalId,
    account_id: asString(row.account_id) || null,
    request_amount: requestAmount,
    fee_amount: feeAmount,
    net_amount: netAmount,
    currency: asString(row.currency, "USD"),
    payout_method: asString(row.payout_method) || asString(row.network) || "wallet_transfer",
    wallet_address: asString(row.wallet_address) || asString(row.destination) || "-",
    status: mapStatus(row.status),
    requested_at: asString(row.requested_at) || asString(row.created_at, new Date().toISOString()),
    reviewed_at: asString(row.reviewed_at) || null,
    processed_at: asString(row.processed_at) || null,
    rejection_reason: asString(row.rejection_reason) || null,
  };
}

export async function getClientWithdrawalWorkspace(): Promise<ClientWithdrawalWorkspace> {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user?.id) {
      return {
        authenticated: false,
        user_id: null,
        available_balance: 0,
        accounts: [],
        rows: [],
      };
    }

    const [availableResult, accountsResult, withdrawalRequestsResult, legacyWithdrawalsResult] = await Promise.all([
      supabase.rpc("finhalo_get_user_withdrawable_balance", {
        p_user_id: user.id,
        p_account_id: null,
      }),
      supabase
        .from("trading_accounts")
        .select("account_id,account_number")
        .eq("user_id", user.id)
        .order("account_id", { ascending: true }),
      supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("requested_at", { ascending: false }),
      supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", user.id)
        .order("requested_at", { ascending: false }),
    ]);

    const availableBalance = !availableResult.error
      ? asNumber(availableResult.data, 0)
      : 0;
    const rowsSource =
      !withdrawalRequestsResult.error && withdrawalRequestsResult.data && withdrawalRequestsResult.data.length > 0
        ? (withdrawalRequestsResult.data as DbRow[])
        : !legacyWithdrawalsResult.error && legacyWithdrawalsResult.data
          ? (legacyWithdrawalsResult.data as DbRow[])
          : [];

    return {
      authenticated: true,
      user_id: user.id,
      available_balance: availableBalance,
      accounts:
        !accountsResult.error && accountsResult.data
          ? (accountsResult.data as DbRow[]).map((row) => ({
              account_id: asString(row.account_id),
              account_number: asString(row.account_number) || null,
            }))
          : [],
      rows: rowsSource
        .map(mapHistoryRow)
        .filter((row): row is ClientWithdrawalHistoryRow => Boolean(row)),
    };
  } catch {
    return {
      authenticated: false,
      user_id: null,
      available_balance: 0,
      accounts: [],
      rows: [],
    };
  }
}

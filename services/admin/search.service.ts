import type { SearchWorkspaceData } from "@/app/admin/search/_types";
import { createClient } from "@/lib/supabase/server";
import { getAdminAccounts } from "./accounts.service";
import { getAdminCommissionBatches } from "./commission.service";
import { getAdminWithdrawalRows } from "./finance.service";
import { getAdminUsers } from "./users.service";

type DbRow = Record<string, unknown>;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export async function getAdminSearchWorkspace(): Promise<SearchWorkspaceData> {
  try {
    const supabase = await createClient();
    const [usersResult, accountsResult, batchesResult, withdrawalsResult] = await Promise.all([
      supabase.from("users").select("user_id, email, display_name"),
      supabase.from("trading_accounts").select("account_id, account_number, user_id, user_display_name"),
      supabase.from("commission_batches").select("batch_id, broker, status"),
      supabase.from("withdrawals").select("withdrawal_id, user_id, beneficiary, amount, status"),
    ]);

    if (
      !usersResult.error &&
      !accountsResult.error &&
      !batchesResult.error &&
      !withdrawalsResult.error
    ) {
      return {
        users: ((usersResult.data as DbRow[] | null) ?? []).map((row) => ({
          user_id: asString(row.user_id) || asString(row.id),
          email: asString(row.email, "unknown@search.local"),
          display_name:
            asString(row.display_name) ||
            asString(row.name) ||
            asString(row.email).split("@")[0] ||
            asString(row.user_id, "Unknown User"),
        })),
        tradingAccounts: ((accountsResult.data as DbRow[] | null) ?? []).map((row) => ({
          account_id: asString(row.account_id) || asString(row.id),
          account_number:
            asString(row.account_number) ||
            asString(row.account_code) ||
            asString(row.account_id),
          user_id: asString(row.user_id, "UNKNOWN"),
          display_name:
            asString(row.user_display_name) ||
            asString(row.display_name) ||
            asString(row.user_id, "Unknown User"),
        })),
        commissionBatches: ((batchesResult.data as DbRow[] | null) ?? []).map((row) => ({
          batch_id: asString(row.batch_id) || asString(row.id),
          broker: asString(row.broker, "Unknown Broker"),
          status: asString(row.status, "review"),
        })),
        withdrawals: ((withdrawalsResult.data as DbRow[] | null) ?? []).map((row) => ({
          withdrawal_id: asString(row.withdrawal_id) || asString(row.id),
          user_id: asString(row.user_id, "UNKNOWN"),
          beneficiary:
            asString(row.beneficiary) ||
            asString(row.user_email) ||
            asString(row.user_id, "Unknown User"),
          amount: Number(row.amount ?? 0),
          status: asString(row.status, "pending"),
        })),
      };
    }
  } catch {
    // Fall through to service-backed fallback.
  }

  const [users, accounts, batches, withdrawals] = await Promise.all([
    getAdminUsers(),
    getAdminAccounts(),
    getAdminCommissionBatches(),
    getAdminWithdrawalRows(),
  ]);

  return {
    users: users.map((user) => ({
      user_id: user.user_id,
      email: user.email,
      display_name: user.display_name,
    })),
    tradingAccounts: accounts.map((account) => ({
      account_id: account.account_id,
      account_number: account.account_id,
      user_id: account.user_id,
      display_name: account.user_display_name,
    })),
    commissionBatches: batches.map((batch) => ({
      batch_id: batch.batch_id,
      broker: batch.broker,
      status: batch.status,
    })),
    withdrawals: withdrawals.map((withdrawal) => ({
      withdrawal_id: withdrawal.withdrawal_id,
      user_id: withdrawal.trader_user_id,
      beneficiary: withdrawal.beneficiary,
      amount: withdrawal.amount,
      status: withdrawal.status,
    })),
  };
}

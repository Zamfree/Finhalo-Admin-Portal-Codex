import {
  getAccountsForUser,
  MOCK_USER_ACTIVITY_SUMMARY,
  MOCK_USERS,
} from "@/app/admin/users/_mock-data";
import type { TradingAccountRecord } from "@/app/admin/accounts/_types";
import type { UserActivitySummary, UserRow, UserStatus, UserType } from "@/app/admin/users/_types";
import { getUserDisplayName } from "@/app/admin/users/_mappers";
import { createClient } from "@/lib/supabase/server";

type DbRow = Record<string, unknown>;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeUserType(value: unknown): UserType {
  return value === "ib" ? "ib" : "trader";
}

function normalizeUserStatus(value: unknown): UserStatus {
  switch (value) {
    case "active":
    case "restricted":
    case "suspended":
      return value;
    default:
      return "active";
  }
}

function getFallbackUserActivitySummary(): UserActivitySummary {
  return {
    commission_summary: "No downstream commission activity yet.",
    finance_summary: "No downstream finance activity yet.",
    rebate_summary: "No downstream rebate activity yet.",
  };
}

function formatUserActivitySummary(count: number, singularLabel: string, pluralLabel: string) {
  if (count <= 0) {
    return `No downstream ${singularLabel.toLowerCase()} activity yet.`;
  }

  if (count === 1) {
    return `1 ${singularLabel} linked to owned trading account activity.`;
  }

  return `${count} ${pluralLabel} linked to owned trading account activity.`;
}

function mapUserRow(row: DbRow): UserRow | null {
  const userId = asString(row.user_id) || asString(row.id);
  const email = asString(row.email);

  if (!userId || !email) {
    return null;
  }

  return {
    user_id: userId,
    email,
    display_name: getUserDisplayName({
      userId,
      email,
      displayName: asString(row.display_name) || null,
      profile: {
        fullName: asString(row.full_name) || asString(row.profile_full_name) || null,
      },
    }),
    user_type: normalizeUserType(row.role ?? row.user_type),
    status: normalizeUserStatus(row.status),
    created_at: asString(row.created_at, new Date().toISOString()),
  };
}

async function getUsersFromSupabase(): Promise<UserRow[] | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return null;
    }

    return (data as DbRow[])
      .map(mapUserRow)
      .filter((row): row is UserRow => Boolean(row));
  } catch {
    return null;
  }
}

function getUsersFromMock(): UserRow[] {
  return MOCK_USERS;
}

function buildOwnedAccountsFromMock(userIds: string[]): Record<string, TradingAccountRecord[]> {
  return Object.fromEntries(userIds.map((userId) => [userId, getAccountsForUser(userId)]));
}

export async function getAdminUsers(): Promise<UserRow[]> {
  return (await getUsersFromSupabase()) ?? getUsersFromMock();
}

export async function getAdminUserById(userId: string): Promise<UserRow | null> {
  const rows = await getAdminUsers();
  return rows.find((row) => row.user_id === userId) ?? null;
}

export async function getAdminAccountsForUser(userId: string): Promise<TradingAccountRecord[]> {
  const { getAdminAccounts } = await import("./accounts.service");
  const rows = await getAdminAccounts();
  return rows.filter((row) => row.user_id === userId);
}

async function getActivityCountsByAccountIds(accountIds: string[]) {
  if (accountIds.length === 0) {
    return {
      commissionCount: 0,
      rebateCount: 0,
      financeCount: 0,
      withdrawalCount: 0,
    };
  }

  try {
    const supabase = await createClient();
    const [commissionResult, rebateResult, financeResult, withdrawalsResult] = await Promise.all([
      supabase.from("commission_records").select("account_id").in("account_id", accountIds),
      supabase.from("rebate_records").select("account_id").in("account_id", accountIds),
      supabase.from("finance_ledger").select("account_id").in("account_id", accountIds),
      supabase.from("withdrawals").select("account_id").in("account_id", accountIds),
    ]);

    return {
      commissionCount:
        !commissionResult.error && commissionResult.data ? commissionResult.data.length : 0,
      rebateCount: !rebateResult.error && rebateResult.data ? rebateResult.data.length : 0,
      financeCount: !financeResult.error && financeResult.data ? financeResult.data.length : 0,
      withdrawalCount:
        !withdrawalsResult.error && withdrawalsResult.data ? withdrawalsResult.data.length : 0,
    };
  } catch {
    return {
      commissionCount: 0,
      rebateCount: 0,
      financeCount: 0,
      withdrawalCount: 0,
    };
  }
}

export async function getAdminUserActivitySummary(userId: string): Promise<UserActivitySummary> {
  const accounts = await getAdminAccountsForUser(userId);

  if (accounts.length === 0) {
    return MOCK_USER_ACTIVITY_SUMMARY[userId] ?? getFallbackUserActivitySummary();
  }

  const counts = await getActivityCountsByAccountIds(accounts.map((account) => account.account_id));

  const financeTotal = counts.financeCount + counts.withdrawalCount;
  const summaries: UserActivitySummary = {
    commission_summary: formatUserActivitySummary(
      counts.commissionCount,
      "commission record",
      "commission records"
    ),
    finance_summary: formatUserActivitySummary(
      financeTotal,
      "finance entry",
      "finance entries"
    ),
    rebate_summary: formatUserActivitySummary(
      counts.rebateCount,
      "rebate record",
      "rebate records"
    ),
  };

  if (
    counts.commissionCount === 0 &&
    counts.rebateCount === 0 &&
    financeTotal === 0 &&
    MOCK_USER_ACTIVITY_SUMMARY[userId]
  ) {
    return MOCK_USER_ACTIVITY_SUMMARY[userId];
  }

  return summaries;
}

export async function getAdminOwnedAccountsByUser(
  userIds: string[]
): Promise<Record<string, TradingAccountRecord[]>> {
  const normalizedUserIds = Array.from(new Set(userIds.filter(Boolean)));

  if (normalizedUserIds.length === 0) {
    return {};
  }

  try {
    const { getAdminAccounts } = await import("./accounts.service");
    const rows = await getAdminAccounts();

    return normalizedUserIds.reduce<Record<string, TradingAccountRecord[]>>((accumulator, userId) => {
      accumulator[userId] = rows.filter((row) => row.user_id === userId);
      return accumulator;
    }, {});
  } catch {
    return buildOwnedAccountsFromMock(normalizedUserIds);
  }
}

export async function getAdminUserActivitySummaryMap(
  userIds: string[]
): Promise<Record<string, UserActivitySummary>> {
  const summaries = await Promise.all(
    userIds.map(async (userId) => [userId, await getAdminUserActivitySummary(userId)] as const)
  );

  return Object.fromEntries(summaries);
}

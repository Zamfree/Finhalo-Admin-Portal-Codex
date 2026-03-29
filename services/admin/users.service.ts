import {
  getAccountsForUser,
  MOCK_USER_ACTIVITY_SUMMARY,
  MOCK_USERS,
} from "@/app/admin/users/_mock-data";
import type { TradingAccountRecord } from "@/app/admin/accounts/_types";
import type {
  UserActivitySummary,
  UserLoginEntry,
  UserOperationalHistory,
  UserOperationEntry,
  UserRow,
  UserStatus,
  UserType,
} from "@/app/admin/users/_types";
import { getUserDisplayName } from "@/app/admin/users/_mappers";
import { createClient } from "@/lib/supabase/server";

type DbRow = Record<string, unknown>;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1 ? true : value === 0 ? false : null;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true" || normalized === "1" || normalized === "enabled") {
      return true;
    }

    if (normalized === "false" || normalized === "0" || normalized === "disabled") {
      return false;
    }
  }

  return null;
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

function getFallbackUserOperationalHistory(userId: string): UserOperationalHistory {
  const timestamp = new Date().toISOString();

  return {
    operations: [
      {
        id: `USR-AUD-${userId}-1`,
        action: "Profile viewed",
        actor: "Admin",
        scope: "Users",
        detail: "Fallback history entry (no backend audit rows detected).",
        created_at: timestamp,
      },
    ],
    logins: [
      {
        id: `USR-LOGIN-${userId}-1`,
        status: "unknown",
        ip_address: "N/A",
        device: "No login history source configured",
        created_at: timestamp,
      },
    ],
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
    safety_lock_until:
      asString(row.safety_lock_until) ||
      asString(row.withdrawal_lock_until) ||
      asString(row.lock_until) ||
      asString(row.lock_12h_until) ||
      null,
    rebate_enabled:
      asBoolean(row.rebate_enabled) ??
      asBoolean(row.rebate_allowed) ??
      asBoolean(row.cashback_enabled) ??
      asBoolean(row.is_rebate_enabled) ??
      null,
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
    const [commissionResult, rebateResult, financeResult, withdrawalRequestsResult, legacyWithdrawalsResult] = await Promise.all([
      supabase.from("commission_records").select("account_id").in("account_id", accountIds),
      supabase.from("rebate_records").select("account_id").in("account_id", accountIds),
      supabase.from("finance_ledger").select("account_id").in("account_id", accountIds),
      supabase.from("withdrawal_requests").select("account_id").in("account_id", accountIds),
      supabase.from("withdrawals").select("account_id").in("account_id", accountIds),
    ]);

    return {
      commissionCount:
        !commissionResult.error && commissionResult.data ? commissionResult.data.length : 0,
      rebateCount: !rebateResult.error && rebateResult.data ? rebateResult.data.length : 0,
      financeCount: !financeResult.error && financeResult.data ? financeResult.data.length : 0,
      withdrawalCount:
        !withdrawalRequestsResult.error && withdrawalRequestsResult.data
          ? withdrawalRequestsResult.data.length
          : !legacyWithdrawalsResult.error && legacyWithdrawalsResult.data
            ? legacyWithdrawalsResult.data.length
            : 0,
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

function normalizeOperationRow(row: DbRow, fallbackId: string): UserOperationEntry {
  const action =
    asString(row.action) || asString(row.event) || asString(row.operation) || "User operation";
  const actor =
    asString(row.actor) || asString(row.admin_email) || asString(row.created_by) || "Admin";
  const scope = asString(row.scope) || asString(row.module) || "Users";
  const detail =
    asString(row.detail) ||
    asString(row.message) ||
    asString(row.note) ||
    asString(row.description) ||
    "No additional detail.";

  return {
    id: asString(row.id, fallbackId),
    action,
    actor,
    scope,
    detail,
    created_at:
      asString(row.created_at) ||
      asString(row.updated_at) ||
      asString(row.logged_at) ||
      new Date().toISOString(),
  };
}

function normalizeLoginRow(row: DbRow, fallbackId: string): UserLoginEntry {
  const statusRaw = asString(row.status) || asString(row.result);
  const normalizedStatus: UserLoginEntry["status"] =
    statusRaw === "success" || statusRaw === "failed" ? statusRaw : "unknown";

  return {
    id: asString(row.id, fallbackId),
    status: normalizedStatus,
    ip_address: asString(row.ip_address) || asString(row.ip, "N/A"),
    device: asString(row.user_agent) || asString(row.device) || asString(row.client, "Unknown"),
    created_at:
      asString(row.created_at) ||
      asString(row.login_at) ||
      asString(row.signed_in_at) ||
      new Date().toISOString(),
  };
}

async function getOperationsMapByUserIds(userIds: string[]): Promise<Record<string, UserOperationEntry[]>> {
  if (userIds.length === 0) {
    return {};
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("admin_action_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error || !data) {
      return {};
    }

    const result = userIds.reduce<Record<string, UserOperationEntry[]>>((accumulator, userId) => {
      const normalized = userId.toLowerCase();
      const rows = (data as DbRow[])
        .filter((row) => {
          const targetCandidates = [
            asString(row.target_user_id),
            asString(row.user_id),
            asString(row.subject_id),
            asString(row.target_id),
            asString(row.reference_id),
          ];

          return targetCandidates.some((candidate) => candidate.toLowerCase() === normalized);
        })
        .slice(0, 12)
        .map((row, index) => normalizeOperationRow(row, `USR-AUD-${userId}-${index + 1}`));

      accumulator[userId] = rows;
      return accumulator;
    }, {});

    return result;
  } catch {
    return {};
  }
}

async function getLoginMapByUserIds(userIds: string[]): Promise<Record<string, UserLoginEntry[]>> {
  if (userIds.length === 0) {
    return {};
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_login_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error || !data) {
      return {};
    }

    const result = userIds.reduce<Record<string, UserLoginEntry[]>>((accumulator, userId) => {
      const normalized = userId.toLowerCase();
      const rows = (data as DbRow[])
        .filter((row) => {
          const targetCandidates = [asString(row.user_id), asString(row.target_user_id)];

          return targetCandidates.some((candidate) => candidate.toLowerCase() === normalized);
        })
        .slice(0, 12)
        .map((row, index) => normalizeLoginRow(row, `USR-LOGIN-${userId}-${index + 1}`));

      accumulator[userId] = rows;
      return accumulator;
    }, {});

    return result;
  } catch {
    return {};
  }
}

export async function getAdminUserOperationalHistoryMap(
  userIds: string[]
): Promise<Record<string, UserOperationalHistory>> {
  const normalizedUserIds = Array.from(new Set(userIds.filter(Boolean)));

  if (normalizedUserIds.length === 0) {
    return {};
  }

  const [operationsMap, loginMap] = await Promise.all([
    getOperationsMapByUserIds(normalizedUserIds),
    getLoginMapByUserIds(normalizedUserIds),
  ]);

  return normalizedUserIds.reduce<Record<string, UserOperationalHistory>>((accumulator, userId) => {
    const operations = operationsMap[userId] ?? [];
    const logins = loginMap[userId] ?? [];

    accumulator[userId] =
      operations.length > 0 || logins.length > 0
        ? {
            operations: operations.length > 0 ? operations : getFallbackUserOperationalHistory(userId).operations,
            logins: logins.length > 0 ? logins : getFallbackUserOperationalHistory(userId).logins,
          }
        : getFallbackUserOperationalHistory(userId);

    return accumulator;
  }, {});
}

export async function getAdminUserActivitySummaryMap(
  userIds: string[]
): Promise<Record<string, UserActivitySummary>> {
  const summaries = await Promise.all(
    userIds.map(async (userId) => [userId, await getAdminUserActivitySummary(userId)] as const)
  );

  return Object.fromEntries(summaries);
}

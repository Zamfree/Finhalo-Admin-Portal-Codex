import {
  MOCK_ACCOUNT_ACTIVITY_SUMMARY,
  MOCK_TRADING_ACCOUNTS,
} from "@/app/admin/accounts/_mock-data";
import type {
  TradingAccountRecord,
  TradingAccountRelatedActivity,
  TradingAccountSnapshotVersion,
  TradingAccountStatus,
} from "@/app/admin/accounts/_types";
import { createClient } from "@/lib/supabase/server";
import type {
  IbRelationshipDepth,
  IbRelationshipSnapshotStatus,
} from "@/types/domain/network";

type DbRow = Record<string, unknown>;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeAccountStatus(value: unknown): TradingAccountStatus {
  switch (value) {
    case "active":
    case "monitoring":
    case "suspended":
      return value;
    default:
      return "active";
  }
}

function normalizeAccountType(value: unknown): TradingAccountRecord["account_type"] {
  switch (value) {
    case "raw":
    case "pro":
      return value;
    default:
      return "standard";
  }
}

function normalizeSnapshotStatus(value: unknown): IbRelationshipSnapshotStatus {
  switch (value) {
    case "active":
    case "inactive":
    case "pending":
      return value;
    default:
      return "active";
  }
}

function normalizeRelationshipDepth(value: unknown): IbRelationshipDepth {
  switch (value) {
    case "has_l1":
    case "has_l2":
    case "trader_only":
      return value;
    default:
      return "trader_only";
  }
}

function mapSnapshotVersion(row: DbRow): TradingAccountSnapshotVersion | null {
  const snapshotId = asString(row.snapshot_id) || asString(row.relationship_snapshot_id) || asString(row.id);
  const traderUserId = asString(row.trader_user_id) || asString(row.trader_id);

  if (!snapshotId || !traderUserId) {
    return null;
  }

  const effectiveFrom = asString(row.effective_from, new Date().toISOString());

  return {
    relationship_snapshot_id: snapshotId,
    snapshot_code: asString(row.snapshot_code, snapshotId),
    trader_user_id: traderUserId,
    trader_display_name:
      asString(row.trader_display_name) || asString(row.trader_name, traderUserId),
    l1_ib_id: asString(row.l1_ib_id) || null,
    l1_ib_display_name: asString(row.l1_ib_display_name) || asString(row.l1_name) || null,
    l2_ib_id: asString(row.l2_ib_id) || null,
    l2_ib_display_name: asString(row.l2_ib_display_name) || asString(row.l2_name) || null,
    relationship_depth: normalizeRelationshipDepth(row.relationship_depth),
    snapshot_status: normalizeSnapshotStatus(row.snapshot_status ?? row.status),
    effective_from: effectiveFrom,
    effective_to: asString(row.effective_to) || null,
    is_current: asBoolean(row.is_current, true),
  };
}

function buildFallbackSnapshot(account: DbRow): TradingAccountSnapshotVersion {
  const accountId = asString(account.account_id) || asString(account.id, "ACCOUNT");
  const traderUserId = asString(account.user_id, "UNKNOWN");
  const traderDisplayName =
    asString(account.user_display_name) || asString(account.display_name) || traderUserId;
  const createdAt = asString(account.created_at, new Date().toISOString());

  return {
    relationship_snapshot_id: `REL-${accountId}`,
    snapshot_code: `SNP-${accountId}`,
    trader_user_id: traderUserId,
    trader_display_name: traderDisplayName,
    l1_ib_id: null,
    l1_ib_display_name: null,
    l2_ib_id: null,
    l2_ib_display_name: null,
    relationship_depth: "trader_only",
    snapshot_status: "active",
    effective_from: createdAt,
    effective_to: null,
    is_current: true,
  };
}

function mapTradingAccountRow(
  row: DbRow,
  relationshipRows: DbRow[]
): TradingAccountRecord | null {
  const accountId = asString(row.account_id) || asString(row.id);
  const userId = asString(row.user_id);

  if (!accountId || !userId) {
    return null;
  }

  const relationshipHistory =
    relationshipRows.map(mapSnapshotVersion).filter(
      (item): item is TradingAccountSnapshotVersion => Boolean(item)
    );
  const currentRelationship =
    relationshipHistory.find((item) => item.is_current) ?? relationshipHistory[0] ?? buildFallbackSnapshot(row);

  return {
    account_id: accountId,
    user_id: userId,
    user_email: asString(row.user_email, "unknown@account.local"),
    user_display_name:
      asString(row.user_display_name) || asString(row.display_name) || asString(row.user_email) || userId,
    broker: asString(row.broker) || asString(row.broker_name, "Unknown Broker"),
    account_type: normalizeAccountType(row.account_type),
    status: normalizeAccountStatus(row.status),
    trader_user_id: currentRelationship.trader_user_id,
    trader_display_name: currentRelationship.trader_display_name,
    l1_ib_id: currentRelationship.l1_ib_id,
    l1_ib_display_name: currentRelationship.l1_ib_display_name,
    l2_ib_id: currentRelationship.l2_ib_id,
    l2_ib_display_name: currentRelationship.l2_ib_display_name,
    created_at: asString(row.created_at, new Date().toISOString()),
    relationship_snapshot_id: currentRelationship.relationship_snapshot_id,
    snapshot_code: currentRelationship.snapshot_code,
    relationship_depth: currentRelationship.relationship_depth,
    relationship_snapshot_status: currentRelationship.snapshot_status,
    relationship_effective_from: currentRelationship.effective_from,
    relationship_effective_to: currentRelationship.effective_to,
    relationship_is_current: currentRelationship.is_current,
    relationship_history: relationshipHistory.length > 0 ? relationshipHistory : [currentRelationship],
  };
}

async function getAccountsFromSupabase(): Promise<TradingAccountRecord[] | null> {
  try {
    const supabase = await createClient();
    const { data: accountRows, error: accountError } = await supabase
      .from("trading_accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (accountError || !accountRows || accountRows.length === 0) {
      return null;
    }

    const accountIds = (accountRows as DbRow[])
      .map((row) => asString(row.account_id) || asString(row.id))
      .filter(Boolean);

    let relationshipsByAccountId = new Map<string, DbRow[]>();

    if (accountIds.length > 0) {
      const { data: relationshipRows, error: relationshipError } = await supabase
        .from("ib_relationships")
        .select("*")
        .in("account_id", accountIds)
        .order("effective_from", { ascending: false });

      if (!relationshipError && relationshipRows) {
        relationshipsByAccountId = (relationshipRows as DbRow[]).reduce<Map<string, DbRow[]>>(
          (accumulator, item) => {
            const accountId = asString(item.account_id);

            if (!accountId) {
              return accumulator;
            }

            accumulator.set(accountId, [...(accumulator.get(accountId) ?? []), item]);
            return accumulator;
          },
          new Map<string, DbRow[]>()
        );
      }
    }

    return (accountRows as DbRow[])
      .map((row) =>
        mapTradingAccountRow(
          row,
          relationshipsByAccountId.get(asString(row.account_id) || asString(row.id)) ?? []
        )
      )
      .filter((item): item is TradingAccountRecord => Boolean(item));
  } catch {
    return null;
  }
}

function getAccountsFromMock(): TradingAccountRecord[] {
  return MOCK_TRADING_ACCOUNTS;
}

function getFallbackAccountActivity(): TradingAccountRelatedActivity {
  return {
    commission_records: 0,
    rebate_records: 0,
    finance_entries: 0,
    withdrawals: 0,
  };
}

async function getActivityCountMap(
  table: string,
  accountIds: string[]
): Promise<Record<string, number>> {
  if (accountIds.length === 0) {
    return {};
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from(table).select("account_id").in("account_id", accountIds);

    if (error || !data) {
      return {};
    }

    return ((data as DbRow[]) ?? []).reduce<Record<string, number>>((accumulator, row) => {
      const accountId = asString(row.account_id);

      if (!accountId) {
        return accumulator;
      }

      accumulator[accountId] = (accumulator[accountId] ?? 0) + 1;
      return accumulator;
    }, {});
  } catch {
    return {};
  }
}

export async function getAdminAccounts(): Promise<TradingAccountRecord[]> {
  return (await getAccountsFromSupabase()) ?? getAccountsFromMock();
}

export async function getAdminAccountById(accountId: string): Promise<TradingAccountRecord | null> {
  const rows = await getAdminAccounts();
  return rows.find((row) => row.account_id === accountId) ?? null;
}

export async function getAdminAccountActivitySummary(
  accountId: string
): Promise<TradingAccountRelatedActivity> {
  const summaries = await getAdminAccountActivitySummaryMap([accountId]);
  return summaries[accountId] ?? MOCK_ACCOUNT_ACTIVITY_SUMMARY[accountId] ?? getFallbackAccountActivity();
}

export async function getAdminAccountActivitySummaryMap(
  accountIds: string[]
): Promise<Record<string, TradingAccountRelatedActivity>> {
  const normalizedAccountIds = Array.from(new Set(accountIds.filter(Boolean)));

  if (normalizedAccountIds.length === 0) {
    return {};
  }

  const [commissionMap, rebateMap, financeMap, withdrawalMap] = await Promise.all([
    getActivityCountMap("commission_records", normalizedAccountIds),
    getActivityCountMap("rebate_records", normalizedAccountIds),
    getActivityCountMap("finance_ledger", normalizedAccountIds),
    getActivityCountMap("withdrawals", normalizedAccountIds),
  ]);

  return normalizedAccountIds.reduce<Record<string, TradingAccountRelatedActivity>>(
    (accumulator, accountId) => {
      const dbSummary: TradingAccountRelatedActivity = {
        commission_records: commissionMap[accountId] ?? 0,
        rebate_records: rebateMap[accountId] ?? 0,
        finance_entries: financeMap[accountId] ?? 0,
        withdrawals: withdrawalMap[accountId] ?? 0,
      };

      const hasDbSignal =
        dbSummary.commission_records > 0 ||
        dbSummary.rebate_records > 0 ||
        dbSummary.finance_entries > 0 ||
        dbSummary.withdrawals > 0;

      accumulator[accountId] = hasDbSignal
        ? dbSummary
        : MOCK_ACCOUNT_ACTIVITY_SUMMARY[accountId] ?? dbSummary;

      return accumulator;
    },
    {}
  );
}

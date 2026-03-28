import { MOCK_ACCOUNT_NETWORK_SNAPSHOTS } from "@/app/admin/network/_mock-data";
import type { NetworkNodeRebateContext, NetworkSnapshotRecord } from "@/app/admin/network/_types";
import { createClient } from "@/lib/supabase/server";
import type { IbRelationshipDepth, IbRelationshipSnapshotStatus } from "@/types/domain/network";

type DbRow = Record<string, unknown>;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asOptionalNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNonNegativeInteger(value: number) {
  return Math.max(0, Math.round(value));
}

function normalizeLifecycleStatus(value: unknown) {
  const normalized = asString(value).trim().toLowerCase();

  if (normalized === "converted" || normalized === "completed" || normalized === "settled") {
    return "converted";
  }

  if (normalized === "active" || normalized === "approved" || normalized === "qualified") {
    return "active";
  }

  if (normalized === "rejected" || normalized === "invalid" || normalized === "blocked") {
    return "rejected";
  }

  return "pending";
}

function buildFunnel(
  invited: number,
  linked: number,
  qualified: number,
  converted: number,
  rejected: number
): NetworkNodeRebateContext["funnel"] {
  const invitedCount = toNonNegativeInteger(invited);
  const linkedCount = toNonNegativeInteger(Math.min(linked, invitedCount));
  const qualifiedCount = toNonNegativeInteger(Math.min(qualified, linkedCount));
  const convertedCount = toNonNegativeInteger(Math.min(converted, qualifiedCount));
  const rejectedCount = toNonNegativeInteger(rejected);
  const conversionRate =
    invitedCount > 0 ? Number(((convertedCount / invitedCount) * 100).toFixed(2)) : 0;

  return {
    invited: invitedCount,
    linked: linkedCount,
    qualified: qualifiedCount,
    converted: convertedCount,
    rejected: rejectedCount,
    conversionRate,
  };
}

function getFallbackFunnelFromSnapshots(
  snapshots: NetworkSnapshotRecord[],
  nodeId: string
): NetworkNodeRebateContext["funnel"] {
  const invited = snapshots.filter((snapshot) => snapshot.l1Id === nodeId || snapshot.l2Id === nodeId).length;
  const linked = invited;
  const qualified = snapshots.filter(
    (snapshot) =>
      (snapshot.l1Id === nodeId || snapshot.l2Id === nodeId) && snapshot.snapshotStatus !== "pending"
  ).length;
  const converted = snapshots.filter(
    (snapshot) => (snapshot.l1Id === nodeId || snapshot.l2Id === nodeId) && snapshot.snapshotStatus === "active"
  ).length;
  const rejected = Math.max(0, invited - qualified);

  return buildFunnel(invited, linked, qualified, converted, rejected);
}

async function getNodeProfileMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  nodeIds: string[]
): Promise<Map<string, DbRow>> {
  const map = new Map<string, DbRow>();
  if (nodeIds.length === 0) {
    return map;
  }

  const keyAttempts = ["user_id", "id"] as const;

  for (const key of keyAttempts) {
    try {
      const { data, error } = await supabase.from("users").select("*").in(key, nodeIds);
      if (error || !data || data.length === 0) {
        continue;
      }

      for (const item of data as DbRow[]) {
        const nodeId = asString(item.user_id) || asString(item.id);
        if (!nodeId) {
          continue;
        }
        map.set(nodeId, item);
      }
      return map;
    } catch {
      continue;
    }
  }

  return map;
}

function getNodeIdFromReferralRow(row: DbRow): string {
  return (
    asString(row.referrer_user_id) ||
    asString(row.ib_user_id) ||
    asString(row.inviter_user_id) ||
    asString(row.parent_ib_user_id) ||
    asString(row.user_id)
  );
}

async function getReferralFunnelByNodeId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  nodeIds: string[]
): Promise<Map<string, NetworkNodeRebateContext["funnel"]>> {
  const result = new Map<string, NetworkNodeRebateContext["funnel"]>();
  if (nodeIds.length === 0) {
    return result;
  }

  const tableAttempts = ["referral_conversions", "referral_records", "referrals"] as const;

  for (const tableName of tableAttempts) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error || !data || data.length === 0) {
        continue;
      }

      const aggregate = new Map<
        string,
        { invited: number; linked: number; qualified: number; converted: number; rejected: number }
      >();

      for (const row of data as DbRow[]) {
        const nodeId = getNodeIdFromReferralRow(row);
        if (!nodeId || !nodeIds.includes(nodeId)) {
          continue;
        }

        const current = aggregate.get(nodeId) ?? {
          invited: 0,
          linked: 0,
          qualified: 0,
          converted: 0,
          rejected: 0,
        };
        const status = normalizeLifecycleStatus(row.status ?? row.state ?? row.stage);

        current.invited += 1;
        if (status !== "pending") {
          current.linked += 1;
        }
        if (status === "active" || status === "converted") {
          current.qualified += 1;
        }
        if (status === "converted") {
          current.converted += 1;
        }
        if (status === "rejected") {
          current.rejected += 1;
        }

        aggregate.set(nodeId, current);
      }

      for (const [nodeId, value] of aggregate.entries()) {
        result.set(
          nodeId,
          buildFunnel(value.invited, value.linked, value.qualified, value.converted, value.rejected)
        );
      }

      return result;
    } catch {
      continue;
    }
  }

  return result;
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
    case "trader_only":
    case "has_l1":
    case "has_l2":
      return value;
    default:
      return "trader_only";
  }
}

function mapRelationshipRow(row: DbRow): NetworkSnapshotRecord | null {
  const snapshotId = asString(row.snapshot_id) || asString(row.id);
  const accountId = asString(row.account_id);
  const traderId = asString(row.trader_user_id) || asString(row.trader_id);

  if (!snapshotId || !accountId || !traderId) {
    return null;
  }

  const accountCode = asString(row.account_code) || asString(row.account_number, accountId);
  const brokerName = asString(row.broker_name) || asString(row.broker, "Unknown Broker");
  const traderDisplayName =
    asString(row.trader_display_name) || asString(row.trader_name, traderId);
  const l1Id = asString(row.l1_ib_id) || null;
  const l1DisplayName = asString(row.l1_ib_display_name) || asString(row.l1_name) || null;
  const l2Id = asString(row.l2_ib_id) || null;
  const l2DisplayName = asString(row.l2_ib_display_name) || asString(row.l2_name) || null;
  const effectiveFrom = asString(row.effective_from, new Date().toISOString());

  return {
    snapshotId,
    snapshotCode: asString(row.snapshot_code, snapshotId),
    accountId,
    accountCode,
    brokerName,
    traderId,
    traderDisplayName,
    l1Id,
    l1DisplayName,
    l2Id,
    l2DisplayName,
    trader: {
      userId: traderId,
      displayName: traderDisplayName,
      email: asString(row.trader_email) || undefined,
    },
    l1: l1Id
      ? {
          userId: l1Id,
          displayName: l1DisplayName ?? l1Id,
          email: asString(row.l1_email) || undefined,
        }
      : null,
    l2: l2Id
      ? {
          userId: l2Id,
          displayName: l2DisplayName ?? l2Id,
          email: asString(row.l2_email) || undefined,
        }
      : null,
    relationshipDepth: normalizeRelationshipDepth(row.relationship_depth),
    effectiveFrom,
    effectiveTo: asString(row.effective_to) || null,
    snapshotStatus: normalizeSnapshotStatus(row.snapshot_status ?? row.status),
    source: asString(row.source, "database"),
    changeReason: asString(row.change_reason) || null,
    createdBy: asString(row.created_by) || null,
    createdAt: asString(row.created_at, effectiveFrom),
    isCurrent: asBoolean(row.is_current, true),
    updatedAt: asString(row.updated_at, effectiveFrom),
    history: [],
  };
}

export async function getAdminNetworkSnapshots(): Promise<NetworkSnapshotRecord[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ib_relationships")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return (data as DbRow[])
        .map(mapRelationshipRow)
        .filter((row): row is NetworkSnapshotRecord => Boolean(row));
    }
  } catch {
    // Fall through to mock data.
  }

  return MOCK_ACCOUNT_NETWORK_SNAPSHOTS;
}

export async function getAdminNetworkNodeRebateContextMap(
  snapshots: NetworkSnapshotRecord[]
): Promise<Map<string, NetworkNodeRebateContext>> {
  const nodeIds = Array.from(
    new Set(
      snapshots.flatMap((snapshot) => [snapshot.traderId, snapshot.l1Id ?? "", snapshot.l2Id ?? ""]).filter(Boolean)
    )
  );
  const contexts = new Map<string, NetworkNodeRebateContext>();

  for (const nodeId of nodeIds) {
    contexts.set(nodeId, {
      rebateRate: null,
      referralCode: null,
      referralLink: null,
      funnel: getFallbackFunnelFromSnapshots(snapshots, nodeId),
    });
  }

  if (nodeIds.length === 0) {
    return contexts;
  }

  try {
    const supabase = await createClient();
    const [profileMap, funnelMap] = await Promise.all([
      getNodeProfileMap(supabase, nodeIds),
      getReferralFunnelByNodeId(supabase, nodeIds),
    ]);

    for (const nodeId of nodeIds) {
      const existing = contexts.get(nodeId);
      if (!existing) {
        continue;
      }

      const profile = profileMap.get(nodeId);
      const mappedRate =
        asOptionalNumber(profile?.rebate_rate) ??
        asOptionalNumber(profile?.rebate_ratio) ??
        asOptionalNumber(profile?.ib_rebate_rate);
      const mappedCode =
        asString(profile?.referral_code) ||
        asString(profile?.invite_code) ||
        asString(profile?.ib_referral_code) ||
        null;
      const mappedLink =
        asString(profile?.referral_link) ||
        asString(profile?.invite_link) ||
        asString(profile?.ib_referral_link) ||
        null;

      contexts.set(nodeId, {
        rebateRate: mappedRate,
        referralCode: mappedCode,
        referralLink: mappedLink,
        funnel: funnelMap.get(nodeId) ?? existing.funnel,
      });
    }
  } catch {
    // Keep fallback contexts.
  }

  return contexts;
}

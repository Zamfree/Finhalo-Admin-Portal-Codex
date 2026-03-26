import { MOCK_ACCOUNT_NETWORK_SNAPSHOTS } from "@/app/admin/network/_mock-data";
import type { NetworkSnapshotRecord } from "@/app/admin/network/_types";
import { createClient } from "@/lib/supabase/server";
import type { IbRelationshipDepth, IbRelationshipSnapshotStatus } from "@/types/domain/network";

type DbRow = Record<string, unknown>;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
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

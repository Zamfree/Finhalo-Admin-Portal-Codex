import type { TradingAccount } from "@/types/domain/account";

import type { TradingAccountRecord } from "./_types";

export function mapDomainAccountToTradingAccountRecord(
  account: TradingAccount
): TradingAccountRecord {
  return {
    account_id: account.accountId,
    user_id: account.ownerUserId,
    user_email: account.ownerEmail,
    user_display_name: account.ownerDisplayName ?? account.ownerEmail,
    broker: account.brokerName,
    account_type: account.accountType,
    status: account.status,
    trader_user_id: account.currentRelationship.traderId,
    trader_display_name:
      account.currentRelationship.traderDisplayName ?? account.currentRelationship.traderId,
    l1_ib_id: account.currentRelationship.l1Id,
    l1_ib_display_name:
      account.currentRelationship.l1DisplayName ?? account.currentRelationship.l1Id,
    l2_ib_id: account.currentRelationship.l2Id,
    l2_ib_display_name:
      account.currentRelationship.l2DisplayName ?? account.currentRelationship.l2Id,
    created_at: account.createdAt,
    relationship_snapshot_id: account.currentRelationship.snapshotId,
    snapshot_code: account.currentRelationship.snapshotCode,
    relationship_depth: account.currentRelationship.relationshipDepth,
    relationship_snapshot_status: account.currentRelationship.snapshotStatus,
    relationship_effective_from: account.currentRelationship.effectiveFrom,
    relationship_effective_to: account.currentRelationship.effectiveTo,
    relationship_is_current: account.currentRelationship.isCurrent,
    relationship_history: account.relationshipHistory.map((snapshot) => ({
      relationship_snapshot_id: snapshot.snapshotId,
      snapshot_code: snapshot.snapshotCode,
      trader_user_id: snapshot.traderId,
      trader_display_name: snapshot.traderDisplayName ?? snapshot.traderId,
      l1_ib_id: snapshot.l1Id,
      l1_ib_display_name: snapshot.l1DisplayName ?? snapshot.l1Id,
      l2_ib_id: snapshot.l2Id,
      l2_ib_display_name: snapshot.l2DisplayName ?? snapshot.l2Id,
      relationship_depth: snapshot.relationshipDepth,
      snapshot_status: snapshot.snapshotStatus,
      effective_from: snapshot.effectiveFrom,
      effective_to: snapshot.effectiveTo,
      is_current: snapshot.isCurrent,
    })),
  };
}

import type {
  AccountNetworkDetail,
  AccountNetworkRow,
  IbDirectClientRow,
  NetworkParty,
} from "@/types/network";

function getEmailPrefix(email?: string) {
  return email?.split("@")[0]?.trim() ?? "";
}

export function getNetworkPartyDisplayName(party?: Partial<NetworkParty> | null) {
  if (!party) {
    return "—";
  }

  if (party.displayName && party.displayName.trim().length > 0) {
    return party.displayName.trim();
  }

  const emailPrefix = getEmailPrefix(party.email);
  if (emailPrefix) {
    return emailPrefix;
  }

  return party.userId ?? "—";
}

export function mapSnapshotToNetworkRow(detail: AccountNetworkDetail): AccountNetworkRow {
  return {
    snapshotId: detail.snapshotId,
    accountId: detail.accountId,
    accountCode: detail.accountCode,
    relationship_snapshot_id: detail.snapshotId,
    brokerId: detail.brokerName.toLowerCase().replace(/\s+/g, "-"),
    brokerName: detail.brokerName,
    traderUserId: detail.traderId,
    traderDisplayName: detail.traderDisplayName ?? getNetworkPartyDisplayName(detail.trader),
    l1UserId: detail.l1Id,
    l1DisplayName:
      detail.l1DisplayName ?? (detail.l1 ? getNetworkPartyDisplayName(detail.l1) : null),
    l2UserId: detail.l2Id,
    l2DisplayName:
      detail.l2DisplayName ?? (detail.l2 ? getNetworkPartyDisplayName(detail.l2) : null),
    relationshipDepth: detail.relationshipDepth,
    snapshotStatus: detail.snapshotStatus,
    effectiveFrom: detail.effectiveFrom,
    effectiveTo: detail.effectiveTo ?? null,
    updatedAt: detail.updatedAt,
  };
}

export function mapSnapshotToIbDirectClientRow(detail: AccountNetworkDetail): IbDirectClientRow {
  return {
    accountId: detail.accountId,
    accountCode: detail.accountCode,
    traderUserId: detail.traderId,
    traderDisplayName: detail.traderDisplayName ?? getNetworkPartyDisplayName(detail.trader),
    brokerName: detail.brokerName,
    snapshotStatus: detail.snapshotStatus,
    effectiveFrom: detail.effectiveFrom,
    relationship_snapshot_id: detail.snapshotId,
  };
}

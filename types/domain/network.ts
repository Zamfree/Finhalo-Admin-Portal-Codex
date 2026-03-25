export type IbRelationshipSnapshotStatus = "active" | "inactive" | "pending";
export type IbRelationshipDepth = "trader_only" | "has_l1" | "has_l2";

export type NetworkParty = {
  userId: string;
  displayName?: string | null;
  email?: string;
};

export type IbRelationshipSnapshot = {
  snapshotId: string;
  snapshotCode: string;
  traderId: string;
  traderDisplayName?: string | null;
  l1Id: string | null;
  l1DisplayName?: string | null;
  l2Id: string | null;
  l2DisplayName?: string | null;
  relationshipDepth: IbRelationshipDepth;
  snapshotStatus: IbRelationshipSnapshotStatus;
  effectiveFrom: string;
  effectiveTo: string | null;
  isCurrent: boolean;
};

export type AccountRelationshipSnapshotRecord = IbRelationshipSnapshot & {
  accountId: string;
  accountCode: string;
  brokerName: string;
  trader: NetworkParty;
  l1: NetworkParty | null;
  l2: NetworkParty | null;
  createdAt: string;
  updatedAt: string;
};

export type NetworkHistoryItem = {
  id: string;
  accountId: string;
  changeType: "assign" | "replace_l1" | "replace_l2" | "remove_l1" | "remove_l2";
  effectiveFrom: string;
  createdAt: string;
  changedBy?: string;
  note?: string | null;
};

export type IbCoverageSummary = {
  ibUserId: string;
  ibDisplayName: string;
  directClientAccounts: number;
  coveredL1Ibs: number;
  totalCoveredAccounts: number;
  activeCoveredAccounts: number;
};

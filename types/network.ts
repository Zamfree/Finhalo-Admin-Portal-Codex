export type AccountNetworkStatus = "active" | "inactive" | "pending";
export type AccountRelationshipDepth = "trader_only" | "has_l1" | "has_l2";

export type NetworkRelationshipParty = {
  userId: string;
  name: string;
  email?: string;
};

export type AccountNetworkRow = {
  id: string;
  accountId: string;
  accountCode: string;
  relationship_snapshot_id: string;
  brokerId: string;
  brokerName: string;
  traderUserId: string;
  traderName: string;
  l1UserId?: string | null;
  l1Name?: string | null;
  l2UserId?: string | null;
  l2Name?: string | null;
  relationshipDepth: AccountRelationshipDepth;
  status: AccountNetworkStatus;
  effectiveFrom: string;
  effectiveTo?: string | null;
  updatedAt: string;
};

export type NetworkHistoryItem = {
  id: string;
  accountId: string;
  changeType: "assign" | "replace_l1" | "replace_l2" | "remove_l1" | "remove_l2";
  oldTraderName?: string | null;
  oldL1Name?: string | null;
  oldL2Name?: string | null;
  newTraderName?: string | null;
  newL1Name?: string | null;
  newL2Name?: string | null;
  effectiveFrom: string;
  createdAt: string;
  changedBy?: string;
  note?: string | null;
};

export type AccountRelationshipSnapshot = {
  id: string;
  snapshotCode: string;
  accountId: string;
  accountCode: string;
  brokerName: string;
  trader: NetworkRelationshipParty;
  l1?: NetworkRelationshipParty | null;
  l2?: NetworkRelationshipParty | null;
  relationshipDepth: AccountRelationshipDepth;
  effectiveTo?: string | null;
  status: AccountNetworkStatus;
  source: string;
  changeReason?: string | null;
  createdBy?: string | null;
  createdAt: string;
  isCurrent: boolean;
  effectiveFrom: string;
  updatedAt: string;
  history: NetworkHistoryItem[];
};

export type AccountNetworkDetail = AccountRelationshipSnapshot;

export type IbNetworkSummary = {
  ibUserId: string;
  ibName: string;
  directClientAccounts: number;
  directSubIbs: number;
  totalCoveredAccounts: number;
  activeCoveredAccounts: number;
};

export type IbDirectClientRow = {
  accountId: string;
  accountCode: string;
  traderUserId: string;
  traderName: string;
  brokerName: string;
  snapshotStatus: AccountNetworkStatus;
  effectiveFrom: string;
  relationship_snapshot_id: string;
};

export type IbDirectSubIbRow = {
  subIbUserId: string;
  subIbName: string;
  coveredAccounts: number;
  activeAccounts: number;
  latestEffectiveFrom: string;
};

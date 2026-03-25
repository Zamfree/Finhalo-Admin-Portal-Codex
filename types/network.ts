import type {
  AccountRelationshipSnapshotRecord,
  IbRelationshipDepth,
  IbRelationshipSnapshot,
  IbRelationshipSnapshotStatus,
  NetworkParty,
} from "@/types/domain/network";

export type AccountNetworkRow = {
  snapshotId: string;
  accountId: string;
  accountCode: string;
  relationship_snapshot_id: string;
  brokerId: string;
  brokerName: string;
  traderUserId: string;
  traderDisplayName: string;
  l1UserId?: string | null;
  l1DisplayName?: string | null;
  l2UserId?: string | null;
  l2DisplayName?: string | null;
  relationshipDepth: IbRelationshipDepth;
  snapshotStatus: IbRelationshipSnapshotStatus;
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

export type AccountNetworkDetail = AccountRelationshipSnapshotRecord & {
  source: string;
  changeReason?: string | null;
  createdBy?: string | null;
  history: NetworkHistoryItem[];
};

export type IbNetworkSummary = {
  ibUserId: string;
  ibDisplayName: string;
  directClientAccounts: number;
  directSubIbs: number;
  totalCoveredAccounts: number;
  activeCoveredAccounts: number;
};

export type IbDirectClientRow = {
  accountId: string;
  accountCode: string;
  traderUserId: string;
  traderDisplayName: string;
  brokerName: string;
  snapshotStatus: IbRelationshipSnapshotStatus;
  effectiveFrom: string;
  relationship_snapshot_id: string;
};

export type IbDirectSubIbRow = {
  subIbUserId: string;
  subIbDisplayName: string;
  coveredAccounts: number;
  activeAccounts: number;
  latestEffectiveFrom: string;
};

export type { IbRelationshipSnapshot, NetworkParty };

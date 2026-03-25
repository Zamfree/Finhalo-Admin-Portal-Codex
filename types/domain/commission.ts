import type { IbRelationshipSnapshotStatus } from "./network";

export type CommissionBatchStatus = "draft" | "processing" | "approved" | "failed";
export type CommissionRecordStatus = "pending" | "posted" | "held";

export type RelationshipSnapshotBinding = {
  relationship_snapshot_id: string | null;
  relationship_snapshot_status?: IbRelationshipSnapshotStatus | null;
};

export type CommissionBatch = {
  batchId: string;
  brokerName: string;
  importedAt: string;
  status: CommissionBatchStatus;
};

export type CommissionRecord = RelationshipSnapshotBinding & {
  commissionId: string;
  batchId: string;
  accountId: string;
  traderUserId: string;
  grossCommission: number;
  status: CommissionRecordStatus;
  generatedAt: string;
};

export type RebateRecord = RelationshipSnapshotBinding & {
  rebateRecordId: string;
  commissionId: string;
  accountId: string;
  amount: number;
  createdAt: string;
};

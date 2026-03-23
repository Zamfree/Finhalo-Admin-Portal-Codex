export type TradingAccountStatus = "active" | "monitoring" | "suspended";
export type TradingAccountRelationshipSnapshotStatus = "active" | "inactive" | "pending";
export type TradingAccountRelationshipDepth = "trader_only" | "has_l1" | "has_l2";

export type TradingAccountSnapshotVersion = {
  relationship_snapshot_id: string;
  snapshot_code: string;
  trader_user_id: string;
  l1_ib_id: string | null;
  l2_ib_id: string | null;
  relationship_depth: TradingAccountRelationshipDepth;
  snapshot_status: TradingAccountRelationshipSnapshotStatus;
  effective_from: string;
  effective_to: string | null;
  is_current: boolean;
};

export type TradingAccountRecord = {
  account_id: string;
  user_id: string;
  user_email: string;
  broker: string;
  account_type: "standard" | "raw" | "pro";
  status: TradingAccountStatus;
  trader_user_id: string;
  l1_ib_id: string | null;
  l2_ib_id: string | null;
  created_at: string;
  relationship_snapshot_id: string;
  snapshot_code: string;
  relationship_depth: TradingAccountRelationshipDepth;
  relationship_snapshot_status: TradingAccountRelationshipSnapshotStatus;
  relationship_effective_from: string;
  relationship_effective_to: string | null;
  relationship_is_current: boolean;
  relationship_history: TradingAccountSnapshotVersion[];
};

export type TradingAccountRelatedActivity = {
  commission_records: number;
  rebate_records: number;
  finance_entries: number;
  withdrawals: number;
};

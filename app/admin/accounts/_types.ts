import type {
  IbRelationshipDepth,
  IbRelationshipSnapshotStatus,
} from "@/types/domain/network";

export type TradingAccountStatus = "active" | "monitoring" | "suspended";

export type TradingAccountSnapshotVersion = {
  relationship_snapshot_id: string;
  snapshot_code: string;
  trader_user_id: string;
  trader_display_name: string;
  l1_ib_id: string | null;
  l1_ib_display_name: string | null;
  l2_ib_id: string | null;
  l2_ib_display_name: string | null;
  relationship_depth: IbRelationshipDepth;
  snapshot_status: IbRelationshipSnapshotStatus;
  effective_from: string;
  effective_to: string | null;
  is_current: boolean;
};

export type TradingAccountRecord = {
  account_id: string;
  user_id: string;
  user_email: string;
  user_display_name: string;
  broker: string;
  account_type: "standard" | "raw" | "pro";
  status: TradingAccountStatus;
  trader_user_id: string;
  trader_display_name: string;
  l1_ib_id: string | null;
  l1_ib_display_name: string | null;
  l2_ib_id: string | null;
  l2_ib_display_name: string | null;
  created_at: string;
  relationship_snapshot_id: string;
  snapshot_code: string;
  relationship_depth: IbRelationshipDepth;
  relationship_snapshot_status: IbRelationshipSnapshotStatus;
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

export type AccountDrawerTab = "overview" | "relationship" | "history" | "activity" | "handoff";

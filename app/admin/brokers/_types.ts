import type { FilterBarBaseProps } from "@/types/system/filters";

export type BrokerListRow = {
  broker_id: string;
  broker_name: string;
  status: "active" | "inactive";
  accounts: number;
  created_at: string;
  commission_batches: number;
  latest_batch_id: string | null;
};

export type BrokerSummaryStats = {
  totalBrokers: number;
  activeBrokers: number;
  inactiveBrokers: number;
  totalLinkedAccounts: number;
};

export type BrokerFilters = {
  broker_query: string;
  status: "all" | BrokerListRow["status"];
};

export type BrokerDrawerTab = "overview" | "context" | "activity" | "handoff";

export type BrokerWorkspaceData = {
  rows: BrokerListRow[];
};

export type BrokerFilterControls = Pick<
  FilterBarBaseProps<BrokerFilters>,
  "inputFilters" | "setInputFilter" | "applyFilters" | "clearFilters"
>;

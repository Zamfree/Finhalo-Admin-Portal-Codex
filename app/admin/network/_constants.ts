import type { NetworkDrawerTab, NetworkFilterOption, NetworkFilters } from "./_types";

export const NETWORK_DEFAULT_FILTERS: NetworkFilters = {
  query: "",
  status: "all",
};

export const NETWORK_STATUS_OPTIONS: NetworkFilterOption[] = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "inactive", label: "Inactive" },
];

export const NETWORK_DRAWER_TABS: readonly NetworkDrawerTab[] = [
  "overview",
  "relationship",
  "signals",
  "modules",
];

export const NETWORK_DRAWER_QUERY_CONFIG = {
  detailKey: "detail_node_id",
  tabKey: "tab",
} as const;

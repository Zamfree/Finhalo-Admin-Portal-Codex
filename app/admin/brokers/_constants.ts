import type { BrokerDrawerTab, BrokerFilters } from "./_types";

export const BROKER_DEFAULT_FILTERS: BrokerFilters = {
  broker_query: "",
  status: "all",
};

export const BROKER_DRAWER_TABS: readonly BrokerDrawerTab[] = [
  "overview",
  "context",
  "activity",
  "handoff",
];

export const BROKERS_PAGE_SIZE = 5;

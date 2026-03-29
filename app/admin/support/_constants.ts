import type { SupportDrawerTab, SupportFilters } from "./_types";

export const SUPPORT_DEFAULT_FILTERS: SupportFilters = {
  query: "",
  status: "all",
  category: "all",
};

export const SUPPORT_DRAWER_TABS: readonly SupportDrawerTab[] = [
  "overview",
  "context",
  "timeline",
];

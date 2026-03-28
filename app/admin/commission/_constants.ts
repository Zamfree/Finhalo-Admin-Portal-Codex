import type { CommissionDrawerTab, CommissionFilters, CommissionWorkspaceTab } from "./_types";

export const COMMISSION_DEFAULT_FILTERS: CommissionFilters = {
  query: "",
  broker: "",
  date_from: "",
  date_to: "",
};

export const COMMISSION_WORKSPACE_TABS = [
  "inputs",
  "allocation",
  "rebates",
] as const satisfies readonly CommissionWorkspaceTab[];

export const COMMISSION_DRAWER_TABS = [
  "overview",
  "links",
] as const satisfies readonly CommissionDrawerTab[];

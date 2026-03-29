import type { AccountFilters } from "./_types";

export const ACCOUNTS_DEFAULT_FILTERS: AccountFilters = {
  query: "",
  broker: "all",
  status: "all",
};

export const ACCOUNT_DRAWER_TABS = [
  "overview",
  "relationship",
  "history",
  "activity",
] as const;

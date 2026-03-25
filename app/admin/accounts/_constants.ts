export const ACCOUNTS_DEFAULT_FILTERS = {
  query: "",
  broker: "all",
  status: "all",
} as const;

export const ACCOUNT_DRAWER_TABS = [
  "overview",
  "relationship",
  "history",
  "activity",
  "handoff",
] as const;

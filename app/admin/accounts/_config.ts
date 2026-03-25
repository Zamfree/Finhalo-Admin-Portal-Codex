export const ACCOUNTS_TABLE_KEYS = [
  "account_id",
  "broker",
  "status",
  "owner",
  "relationship",
] as const;

export const ACCOUNT_DRAWER_QUERY_CONFIG = {
  detailKey: "detail_account_id",
  tabKey: "tab",
} as const;

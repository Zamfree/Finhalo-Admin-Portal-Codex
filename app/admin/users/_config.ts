export const USERS_TABLE_KEYS = [
  "user_id",
  "email",
  "status",
  "account_count",
  "primary_context",
  "created_at",
] as const;

export const USER_DRAWER_QUERY_CONFIG = {
  detailKey: "detail_user_id",
  tabKey: "tab",
} as const;

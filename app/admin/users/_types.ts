export type UserType = "trader" | "ib";

export type UserStatus = "active" | "restricted" | "suspended";

export type UserRow = {
  user_id: string;
  email: string;
  display_name: string;
  user_type: UserType;
  status: UserStatus;
  created_at: string;
};

export type UserFilters = {
  query: string;
  status: "all" | UserStatus;
};

export type UserActivitySummary = {
  commission_summary: string;
  finance_summary: string;
  rebate_summary: string;
};

export type UserType = "trader" | "ib";

export type UserStatus = "active" | "restricted" | "suspended";

export type UserRow = {
  user_id: string;
  email: string;
  display_name: string;
  user_type: UserType;
  status: UserStatus;
  created_at: string;
  safety_lock_until?: string | null;
  rebate_enabled?: boolean | null;
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

export type UserOperationEntry = {
  id: string;
  action: string;
  actor: string;
  scope: string;
  detail: string;
  created_at: string;
};

export type UserLoginEntry = {
  id: string;
  status: "success" | "failed" | "unknown";
  ip_address: string;
  device: string;
  created_at: string;
};

export type UserOperationalHistory = {
  operations: UserOperationEntry[];
  logins: UserLoginEntry[];
};

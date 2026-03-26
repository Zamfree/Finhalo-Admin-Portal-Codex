import type { UserFilters } from "./_types";

export const USERS_DEFAULT_FILTERS: UserFilters = {
  query: "",
  status: "all",
};

export const USER_DRAWER_TABS = [
  "overview", 
  "accounts", 
  "relationship", 
  "history", 
  "activity", 
  "handoff"] as const;

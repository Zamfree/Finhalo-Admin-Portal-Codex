import type { ReferralFilters } from "./_types";

export const REFERRAL_DEFAULT_FILTERS: ReferralFilters = {
  query: "",
  status: "all",
};

export const REFERRAL_DRAWER_TABS = [
  "overview",
  "rules",
  "performance",
  "handoff",
] as const;

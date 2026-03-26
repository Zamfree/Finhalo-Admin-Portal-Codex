import type { CampaignFilters } from "./_types";

export const CAMPAIGN_DEFAULT_FILTERS: CampaignFilters = {
  query: "",
  status: "all",
  type: "all",
};

export const CAMPAIGN_DRAWER_TABS = [
  "overview",
  "targeting",
  "rules",
  "performance",
  "handoff",
] as const;
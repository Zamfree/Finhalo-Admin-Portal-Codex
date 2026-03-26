export type CampaignType = "trading" | "deposit" | "referral";
export type CampaignStatus = "active" | "scheduled" | "ended";

export type CampaignRecord = {
  campaign_id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  reward_type: string;
  participants: number;
  start_at: string;
  end_at: string;
  overview: string;
  targeting_summary: string;
  rules: string[];
  performance_summary: string;
};

export type CampaignFilters = {
  query: string;
  status: string;
  type: string;
};

export type CampaignOperationalStage = "preparation" | "execution" | "settlement";

export type CampaignOperationalPosture = {
  stage: CampaignOperationalStage;
  stageLabel: string;
  nextAction: string;
  linkedModuleLabel: string;
  reviewNote: string;
};

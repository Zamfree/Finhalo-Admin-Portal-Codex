export type CampaignType = "trading" | "deposit" | "referral";
export type CampaignStatus = "active" | "scheduled" | "ended";

export type Campaign = {
  campaignId: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  rewardType: string;
  participants: number;
  startAt: string;
  endAt: string;
  targetingSummary?: string;
  performanceSummary?: string;
};

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
  rules: string[];
  rewards: string[];
  participant_summary: string;
  payout_status: string;
};

import type { Campaign } from "@/types/domain/campaign";

import type { CampaignRecord } from "./_types";

export function mapCampaignToRecord(campaign: Campaign): CampaignRecord {
  return {
    campaign_id: campaign.campaignId,
    name: campaign.name,
    type: campaign.type,
    status: campaign.status,
    reward_type: campaign.rewardType,
    participants: campaign.participants,
    start_at: campaign.startAt,
    end_at: campaign.endAt,
    overview: "",
    targeting_summary: campaign.targetingSummary ?? "",
    rules: [],
    performance_summary: campaign.performanceSummary ?? "",
  };
}

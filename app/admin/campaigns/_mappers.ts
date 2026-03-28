import type { Campaign } from "@/types/domain/campaign";
import type { CampaignOperationalPosture, CampaignRecord } from "./_types";

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
    participant_rows: [],
  };
}

export function getCampaignOperationalPosture(
  campaign: Pick<CampaignRecord, "status" | "type">
): CampaignOperationalPosture {
  const linkedModuleLabel =
    campaign.type === "referral"
      ? "Referral"
      : campaign.type === "deposit"
        ? "Finance"
        : "Commission";

  if (campaign.status === "scheduled") {
    return {
      stage: "preparation",
      stageLabel: "Preparation",
      nextAction: "Confirm targeting scope and reward readiness before launch.",
      linkedModuleLabel,
      reviewNote: "Use this stage to verify participant criteria and downstream posting rules.",
    };
  }

  if (campaign.status === "active") {
    return {
      stage: "execution",
      stageLabel: "Execution",
      nextAction: "Monitor participation quality and keep payout dependencies in sync.",
      linkedModuleLabel,
      reviewNote: "Keep the campaign read-first and track signal quality instead of deep account analytics.",
    };
  }

  return {
    stage: "settlement",
    stageLabel: "Settlement Review",
    nextAction: "Review performance outcome and confirm any downstream reward handling.",
    linkedModuleLabel,
    reviewNote: "Ended campaigns should remain auditable before any payout or archive decision.",
  };
}

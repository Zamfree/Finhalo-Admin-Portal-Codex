import type { ReferralStatus } from "@/types/domain/referral";

export type ReferralRecord = {
  referral_id: string;
  name: string;
  status: ReferralStatus;
  reward_model: string;
  participants: number;
  start_at: string;
  end_at: string;
  overview: string;
  rules: string[];
  performance_summary: string;
};
export type ReferralRow = {
  id: string;
  referralCode: string;
  referrerUserId: string;
  referrerName: string;
  refereeUserId: string | null;
  refereeName: string | null;
  status: "pending" | "active" | "converted" | "rejected";
  level: 1 | 2;
  createdAt: string;
  updatedAt: string;
};
export type ReferralFilters = {
  query: string;
  status: string;
};
export type ReferralDrawerTab = "overview" | "rules" | "performance";

export type ReferralOperationalStage = "qualification" | "conversion" | "settlement";

export type ReferralOperationalPosture = {
  stage: ReferralOperationalStage;
  stageLabel: string;
  nextAction: string;
  linkedModuleLabel: string;
  reviewNote: string;
};

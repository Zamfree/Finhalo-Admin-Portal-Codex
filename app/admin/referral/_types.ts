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

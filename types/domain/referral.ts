export type ReferralStatus = "active" | "scheduled" | "ended";

export type ReferralProgram = {
  referralId: string;
  name: string;
  status: ReferralStatus;
  rewardModel: string;
  participants: number;
  startAt: string;
  endAt: string;
  summary?: string;
};

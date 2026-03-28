import type { CampaignRecord } from "./_types";

export const MOCK_CAMPAIGNS: CampaignRecord[] = [
  {
    campaign_id: "CMP-TRD-2026-01",
    name: "Q2 Active Trader Booster",
    type: "trading",
    status: "active",
    reward_type: "Volume rebate credit",
    participants: 428,
    start_at: "2026-04-01T00:00:00Z",
    end_at: "2026-06-30T23:59:00Z",
    overview: "Rewards active traders based on qualifying commission volume during the quarter.",
    targeting_summary: "Targets approved active traders across high-volume broker programs.",
    rules: [
      "Applies only to approved trading accounts.",
      "Qualification resets at the start of the campaign window.",
      "Rewards are calculated after commission batch validation.",
    ],
    performance_summary:
      "High participation from multi-account active traders across MT5 brokers.",
    participant_rows: [],
  },
  {
    campaign_id: "CMP-DEP-2026-02",
    name: "Spring Deposit Accelerator",
    type: "deposit",
    status: "scheduled",
    reward_type: "Deposit bonus credit",
    participants: 192,
    start_at: "2026-05-10T00:00:00Z",
    end_at: "2026-06-10T23:59:00Z",
    overview: "Encourages larger qualifying deposits before the next trading cycle begins.",
    targeting_summary: "Focused on newly funded trading accounts with larger deposit intent.",
    rules: [
      "Only net new deposits within the campaign period qualify.",
      "Each eligible account may receive one payout tier.",
      "Finance review is required before credits are posted.",
    ],
    performance_summary:
      "Early registrations are concentrated in high-balance accounts.",
    participant_rows: [],
  },
  {
    campaign_id: "CMP-REF-2026-01",
    name: "Referral Network Kickoff",
    type: "referral",
    status: "ended",
    reward_type: "Referral payout",
    participants: 87,
    start_at: "2026-01-15T00:00:00Z",
    end_at: "2026-03-01T23:59:00Z",
    overview: "Referral-focused incentive for bringing newly approved trading accounts into the platform.",
    targeting_summary: "Targeted partner-led account acquisition during the quarter kickoff window.",
    rules: [
      "Referred accounts must pass approval and remain active through settlement review.",
      "Only first-time referrals count toward payout.",
      "Duplicate beneficiary checks apply before payout approval.",
    ],
    performance_summary:
      "Most qualified referrals came from established L1 partners.",
    participant_rows: [],
  },
];

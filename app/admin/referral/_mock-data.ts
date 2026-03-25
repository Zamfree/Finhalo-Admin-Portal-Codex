import type { ReferralRecord } from "./_types";

export const MOCK_REFERRALS: ReferralRecord[] = [
  {
    referral_id: "REF-2026-01",
    name: "Invite Rebate Launch",
    status: "active",
    reward_model: "Qualified account rebate credit",
    participants: 116,
    start_at: "2026-02-01T00:00:00Z",
    end_at: "2026-06-30T23:59:00Z",
    overview:
      "Rewards approved referred trading accounts with a fixed rebate credit after operational review.",
    rules: [
      "Only first-time approved referred accounts qualify.",
      "Duplicate beneficiary checks apply before settlement.",
      "Manual finance review is required before posting.",
    ],
    performance_summary:
      "Participation is concentrated among existing partner desks with steady weekly approvals.",
  },
  {
    referral_id: "REF-2026-02",
    name: "Spring Invite Push",
    status: "scheduled",
    reward_model: "Tiered invite bonus",
    participants: 64,
    start_at: "2026-05-01T00:00:00Z",
    end_at: "2026-07-15T23:59:00Z",
    overview:
      "A scheduled referral push designed to increase newly approved account acquisition before the summer cycle.",
    rules: [
      "Only referred accounts approved inside the campaign window count.",
      "One payout tier per referrer per referred account.",
      "Compliance review can hold payout readiness.",
    ],
    performance_summary:
      "Pre-launch registrations show stronger adoption from recent invite-oriented operators.",
  },
  {
    referral_id: "REF-2025-04",
    name: "Year-End Partner Invite",
    status: "ended",
    reward_model: "Fixed referral settlement",
    participants: 89,
    start_at: "2025-11-15T00:00:00Z",
    end_at: "2026-01-15T23:59:00Z",
    overview:
      "Closed referral program used for year-end invite settlement and approval tracking.",
    rules: [
      "Only approved and retained referred accounts were eligible.",
      "Payouts were settled after compliance confirmation.",
      "Late approvals rolled into the next operating cycle.",
    ],
    performance_summary:
      "The program closed with stable partner participation and moderate settlement volume.",
  },
];

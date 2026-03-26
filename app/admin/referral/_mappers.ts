import type { ReferralProgram } from "@/types/domain/referral";
import type {
  ReferralFilters,
  ReferralOperationalPosture,
  ReferralRecord,
} from "./_types";

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function matchesReferralQuery(row: ReferralRecord, query: string) {
  if (!query) return true;

  return (
    row.name.toLowerCase().includes(query) ||
    row.referral_id.toLowerCase().includes(query) ||
    row.reward_model.toLowerCase().includes(query)
  );
}

export function filterReferralRows(rows: ReferralRecord[], filters: ReferralFilters) {
  const normalizedQuery = normalizeSearchValue(filters.query);

  return rows.filter((row) => {
    const matchesQuery = matchesReferralQuery(row, normalizedQuery);
    const matchesStatus = filters.status === "all" || row.status === filters.status;

    return matchesQuery && matchesStatus;
  });
}

export function mapReferralProgramToRecord(program: ReferralProgram): ReferralRecord {
  return {
    referral_id: program.referralId,
    name: program.name,
    status: program.status,
    reward_model: program.rewardModel,
    participants: program.participants,
    start_at: program.startAt,
    end_at: program.endAt,
    overview: program.summary ?? "",
    rules: [],
    performance_summary: "",
  };
}

export function getReferralOperationalPosture(
  referral: Pick<ReferralRecord, "status">
): ReferralOperationalPosture {
  if (referral.status === "scheduled") {
    return {
      stage: "qualification",
      stageLabel: "Qualification Setup",
      nextAction: "Confirm invite rules, eligibility scope, and settlement dependencies before launch.",
      linkedModuleLabel: "Settings",
      reviewNote: "Scheduled referral programs should be checked for duplicate-beneficiary and payout readiness before they open.",
    };
  }

  if (referral.status === "active") {
    return {
      stage: "conversion",
      stageLabel: "Conversion Tracking",
      nextAction: "Track approved referrals and keep downstream rebate readiness aligned with active invite flow.",
      linkedModuleLabel: "Campaigns",
      reviewNote: "Active programs should stay focused on approved-account conversion, not deep account analytics.",
    };
  }

  return {
    stage: "settlement",
    stageLabel: "Settlement Review",
    nextAction: "Review final referral outcome and confirm any downstream payout handling before closure.",
    linkedModuleLabel: "Finance",
    reviewNote: "Ended referral programs should remain auditable before any posting, archive, or carry-forward decision.",
  };
}

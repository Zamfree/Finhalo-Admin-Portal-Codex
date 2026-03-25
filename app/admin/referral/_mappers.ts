import type { ReferralProgram } from "@/types/domain/referral";

import type { ReferralRecord } from "./_types";

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

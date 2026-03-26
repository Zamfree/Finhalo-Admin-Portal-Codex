import { MOCK_REFERRALS } from "@/app/admin/referral/_mock-data";
import type { ReferralRecord } from "@/app/admin/referral/_types";
import { createClient } from "@/lib/supabase/server";

type DbRow = Record<string, unknown>;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeReferralStatus(value: unknown): ReferralRecord["status"] {
  switch (value) {
    case "active":
    case "scheduled":
    case "ended":
      return value;
    default:
      return "scheduled";
  }
}

function mapReferralRow(row: DbRow): ReferralRecord | null {
  const referralId = asString(row.referral_id) || asString(row.id);
  const name = asString(row.name) || asString(row.title);

  if (!referralId || !name) {
    return null;
  }

  return {
    referral_id: referralId,
    name,
    status: normalizeReferralStatus(row.status),
    reward_model: asString(row.reward_model, "Referral reward"),
    participants: asNumber(row.participants),
    start_at: asString(row.start_at, new Date().toISOString()),
    end_at: asString(row.end_at, new Date().toISOString()),
    overview: asString(row.overview, "Referral program overview."),
    rules: Array.isArray(row.rules)
      ? row.rules.map((item) => String(item))
      : [asString(row.primary_rule, "Rules pending configuration.")],
    performance_summary: asString(
      row.performance_summary,
      "Performance data is pending server-side rollout."
    ),
  };
}

export async function getAdminReferralWorkspace(): Promise<ReferralRecord[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("referral_programs")
      .select("*")
      .order("start_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return (data as DbRow[])
        .map(mapReferralRow)
        .filter((row): row is ReferralRecord => Boolean(row));
    }
  } catch {
    // Fall through to mock data.
  }

  return MOCK_REFERRALS;
}

export async function getAdminReferralById(referralId: string): Promise<ReferralRecord | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("referral_programs")
      .select("*")
      .eq("referral_id", referralId)
      .maybeSingle();

    if (!error && data) {
      return mapReferralRow(data as DbRow);
    }
  } catch {
    // Fall through to mock data.
  }

  return MOCK_REFERRALS.find((item) => item.referral_id === referralId) ?? null;
}

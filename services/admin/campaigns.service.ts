import { MOCK_CAMPAIGNS } from "@/app/admin/campaigns/_mock-data";
import type { CampaignRecord } from "@/app/admin/campaigns/_types";
import { createClient } from "@/lib/supabase/server";

type DbRow = Record<string, unknown>;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeCampaignType(value: unknown): CampaignRecord["type"] {
  switch (value) {
    case "trading":
    case "deposit":
    case "referral":
      return value;
    default:
      return "trading";
  }
}

function normalizeCampaignStatus(value: unknown): CampaignRecord["status"] {
  switch (value) {
    case "active":
    case "scheduled":
    case "ended":
      return value;
    default:
      return "scheduled";
  }
}

function mapCampaignRow(row: DbRow): CampaignRecord | null {
  const campaignId = asString(row.campaign_id) || asString(row.id);
  const name = asString(row.name) || asString(row.title);

  if (!campaignId || !name) {
    return null;
  }

  return {
    campaign_id: campaignId,
    name,
    type: normalizeCampaignType(row.type),
    status: normalizeCampaignStatus(row.status),
    reward_type: asString(row.reward_type, "Campaign reward"),
    participants: asNumber(row.participants),
    start_at: asString(row.start_at, new Date().toISOString()),
    end_at: asString(row.end_at, new Date().toISOString()),
    overview: asString(row.overview, "Campaign overview."),
    targeting_summary: asString(row.targeting_summary, "Targeting details pending configuration."),
    rules: Array.isArray(row.rules)
      ? row.rules.map((item) => String(item))
      : [asString(row.primary_rule, "Rules pending configuration.")],
    performance_summary: asString(
      row.performance_summary,
      "Performance data is pending server-side rollout."
    ),
  };
}

export async function getAdminCampaigns(): Promise<CampaignRecord[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("start_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return (data as DbRow[])
        .map(mapCampaignRow)
        .filter((row): row is CampaignRecord => Boolean(row));
    }
  } catch {
    // Fall through to mock data.
  }

  return MOCK_CAMPAIGNS;
}

export async function getAdminCampaignById(campaignId: string): Promise<CampaignRecord | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("campaign_id", campaignId)
      .maybeSingle();

    if (!error && data) {
      return mapCampaignRow(data as DbRow);
    }
  } catch {
    // Fall through to mock data.
  }

  return MOCK_CAMPAIGNS.find((item) => item.campaign_id === campaignId) ?? null;
}

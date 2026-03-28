import { MOCK_CAMPAIGNS } from "@/app/admin/campaigns/_mock-data";
import type {
  CampaignParticipantRow,
  CampaignParticipantStatus,
  CampaignRecord,
} from "@/app/admin/campaigns/_types";
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

function normalizeParticipantStatus(value: unknown): CampaignParticipantStatus {
  const normalized = asString(value).trim().toLowerCase();
  if (normalized === "qualified") {
    return "qualified";
  }

  if (normalized === "completed" || normalized === "converted") {
    return "completed";
  }

  if (normalized === "disqualified" || normalized === "rejected" || normalized === "invalid") {
    return "disqualified";
  }

  return "joined";
}

function normalizeProgress(value: unknown) {
  const parsed = asNumber(value, 0);
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function mapParticipantRow(row: DbRow): CampaignParticipantRow | null {
  const participantId = asString(row.participant_id) || asString(row.id);
  const userId = asString(row.user_id);
  const campaignId =
    asString(row.campaign_id) || asString(row.program_id) || asString(row.campaign_code);

  if (!participantId || !userId || !campaignId) {
    return null;
  }

  return {
    participant_id: participantId,
    user_id: userId,
    user_name: asString(row.user_name) || asString(row.display_name, userId),
    account_id: asString(row.account_id) || null,
    status: normalizeParticipantStatus(row.status),
    progress_percent: normalizeProgress(row.progress_percent ?? row.progress ?? row.progress_pct),
    joined_at: asString(row.joined_at, new Date().toISOString()),
    updated_at: asString(row.updated_at, new Date().toISOString()),
  };
}

function createMockParticipants(campaignId: string, totalParticipants: number): CampaignParticipantRow[] {
  const sampleCount = Math.min(6, Math.max(2, Math.floor(totalParticipants / 40) || 2));
  const rows: CampaignParticipantRow[] = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const progress = Math.max(5, Math.min(100, 20 + index * 15));
    const status: CampaignParticipantStatus =
      progress >= 100 ? "completed" : progress >= 65 ? "qualified" : "joined";

    rows.push({
      participant_id: `${campaignId}-P-${String(index + 1).padStart(3, "0")}`,
      user_id: `USR-${String(2000 + index).padStart(4, "0")}`,
      user_name: `Participant ${index + 1}`,
      account_id: `ACC-${String(9000 + index).padStart(4, "0")}`,
      status,
      progress_percent: progress,
      joined_at: new Date(Date.now() - (index + 1) * 86400000).toISOString(),
      updated_at: new Date(Date.now() - index * 3600000).toISOString(),
    });
  }
  return rows;
}

async function getParticipantsByCampaignId(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Map<string, CampaignParticipantRow[]>> {
  const tableAttempts = ["campaign_participants", "campaign_enrollments"] as const;

  for (const tableName of tableAttempts) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(5000);

      if (error || !data || data.length === 0) {
        continue;
      }

      const map = new Map<string, CampaignParticipantRow[]>();

      for (const raw of data as DbRow[]) {
        const mapped = mapParticipantRow(raw);
        if (!mapped) {
          continue;
        }

        const campaignId =
          asString(raw.campaign_id) || asString(raw.program_id) || asString(raw.campaign_code);
        const items = map.get(campaignId) ?? [];
        items.push(mapped);
        map.set(campaignId, items);
      }

      for (const [campaignId, rows] of map.entries()) {
        map.set(
          campaignId,
          rows.sort(
            (left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
          )
        );
      }

      return map;
    } catch {
      continue;
    }
  }

  return new Map<string, CampaignParticipantRow[]>();
}

function mapCampaignRow(
  row: DbRow,
  participantsByCampaignId: ReadonlyMap<string, CampaignParticipantRow[]>
): CampaignRecord | null {
  const campaignId = asString(row.campaign_id) || asString(row.id);
  const name = asString(row.name) || asString(row.title);

  if (!campaignId || !name) {
    return null;
  }

  const participants = asNumber(row.participants);
  const participantRows =
    participantsByCampaignId.get(campaignId) ?? createMockParticipants(campaignId, participants);

  return {
    campaign_id: campaignId,
    name,
    type: normalizeCampaignType(row.type),
    status: normalizeCampaignStatus(row.status),
    reward_type: asString(row.reward_type, "Campaign reward"),
    participants,
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
    participant_rows: participantRows,
  };
}

export async function getAdminCampaigns(): Promise<CampaignRecord[]> {
  try {
    const supabase = await createClient();
    const participantsByCampaignId = await getParticipantsByCampaignId(supabase);
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("start_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return (data as DbRow[])
        .map((row) => mapCampaignRow(row, participantsByCampaignId))
        .filter((row): row is CampaignRecord => Boolean(row));
    }
  } catch {
    // Fall through to mock data.
  }

  return MOCK_CAMPAIGNS.map((campaign) => ({
    ...campaign,
    participant_rows: createMockParticipants(campaign.campaign_id, campaign.participants),
  }));
}

export async function getAdminCampaignById(campaignId: string): Promise<CampaignRecord | null> {
  try {
    const supabase = await createClient();
    const participantsByCampaignId = await getParticipantsByCampaignId(supabase);
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("campaign_id", campaignId)
      .maybeSingle();

    if (!error && data) {
      return mapCampaignRow(data as DbRow, participantsByCampaignId);
    }
  } catch {
    // Fall through to mock data.
  }

  const campaign = MOCK_CAMPAIGNS.find((item) => item.campaign_id === campaignId) ?? null;
  if (!campaign) {
    return null;
  }

  return {
    ...campaign,
    participant_rows: createMockParticipants(campaign.campaign_id, campaign.participants),
  };
}

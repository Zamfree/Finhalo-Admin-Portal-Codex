"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CampaignMutationState = {
  error?: string;
  success?: string;
};

const INITIAL_STATE: CampaignMutationState = {};

function normalizeStatus(rawStatus: string): "active" | "scheduled" | "ended" {
  const normalized = rawStatus.trim().toLowerCase();
  if (normalized === "active" || normalized === "ended") {
    return normalized;
  }
  return "scheduled";
}

function normalizeType(rawType: string): "trading" | "deposit" | "referral" {
  const normalized = rawType.trim().toLowerCase();
  if (normalized === "deposit" || normalized === "referral") {
    return normalized;
  }
  return "trading";
}

function normalizeDateTime(rawValue: string) {
  const trimmed = rawValue.trim();
  const parsed = Date.parse(trimmed);
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toISOString();
  }
  return new Date().toISOString();
}

function parseRules(rawValue: string) {
  const lines = rawValue
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.length > 0 ? lines : ["Rules pending configuration."];
}

function createCampaignId() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const token = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `CMP-${y}${m}${d}-${token}`;
}

function isMissingColumnError(message: string) {
  return /column .* does not exist/i.test(message);
}

function isUniqueViolation(message: string) {
  return /duplicate key|already exists|unique/i.test(message);
}

async function updateCampaignWithPayloadAttempts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  campaignId: string,
  payloadAttempts: Array<Record<string, unknown>>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const keyAttempts = ["campaign_id", "id"] as const;
  let lastError = "Failed to update campaign.";

  for (const key of keyAttempts) {
    for (const payload of payloadAttempts) {
      const { data, error } = await supabase
        .from("campaigns")
        .update(payload)
        .eq(key, campaignId)
        .select(key)
        .maybeSingle();

      if (!error && data) {
        return { ok: true };
      }

      if (error) {
        lastError = error.message;
        if (!isMissingColumnError(error.message)) {
          break;
        }
      }
    }
  }

  return { ok: false, error: lastError };
}

function buildPayload(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = normalizeType(String(formData.get("type") ?? "trading"));
  const status = normalizeStatus(String(formData.get("status") ?? "scheduled"));
  const rewardType = String(formData.get("reward_type") ?? "").trim() || "Campaign reward";
  const participants = Number(formData.get("participants") ?? "0");
  const startAt = normalizeDateTime(String(formData.get("start_at") ?? ""));
  const endAt = normalizeDateTime(String(formData.get("end_at") ?? ""));
  const overview = String(formData.get("overview") ?? "").trim() || "Campaign overview.";
  const targetingSummary =
    String(formData.get("targeting_summary") ?? "").trim() || "Targeting details pending configuration.";
  const performanceSummary =
    String(formData.get("performance_summary") ?? "").trim() ||
    "Performance data is pending server-side rollout.";
  const rules = parseRules(String(formData.get("rules_text") ?? ""));

  return {
    name,
    type,
    status,
    reward_type: rewardType,
    participants: Number.isFinite(participants) ? Math.max(0, Math.round(participants)) : 0,
    start_at: startAt,
    end_at: endAt,
    overview,
    targeting_summary: targetingSummary,
    performance_summary: performanceSummary,
    rules,
  };
}

export async function createCampaignAction(
  _prevState: CampaignMutationState = INITIAL_STATE,
  formData: FormData
): Promise<CampaignMutationState> {
  void _prevState;
  const campaignId = String(formData.get("campaign_id") ?? "").trim() || createCampaignId();
  const payload = buildPayload(formData);

  if (!payload.name) {
    return { error: "Campaign name is required." };
  }

  const supabase = await createClient();
  const payloadAttempts: Array<Record<string, unknown>> = [
    { campaign_id: campaignId, ...payload },
    { id: campaignId, ...payload },
    { campaign_code: campaignId, ...payload },
  ];

  let lastError = "Failed to create campaign.";

  for (const attempt of payloadAttempts) {
    const { error } = await supabase.from("campaigns").insert(attempt);
    if (!error) {
      revalidatePath("/admin/campaigns");
      revalidatePath(`/admin/campaigns/${campaignId}`);
      return { success: `Campaign ${campaignId} created.` };
    }

    if (isUniqueViolation(error.message)) {
      return { error: `Campaign ${campaignId} already exists.` };
    }

    lastError = error.message;
    if (!isMissingColumnError(error.message)) {
      break;
    }
  }

  return { error: lastError };
}

export async function updateCampaignAction(
  _prevState: CampaignMutationState = INITIAL_STATE,
  formData: FormData
): Promise<CampaignMutationState> {
  void _prevState;
  const campaignId = String(formData.get("campaign_id") ?? "").trim();
  const payload = buildPayload(formData);

  if (!campaignId) {
    return { error: "Campaign ID is required." };
  }

  if (!payload.name) {
    return { error: "Campaign name is required." };
  }

  const supabase = await createClient();
  const updated = await updateCampaignWithPayloadAttempts(supabase, campaignId, [payload]);
  if (!updated.ok) {
    return { error: updated.error };
  }

  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${campaignId}`);

  return { success: `Campaign ${campaignId} updated.` };
}

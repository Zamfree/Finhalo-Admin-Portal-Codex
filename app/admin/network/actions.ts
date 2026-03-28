"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type NetworkRebateMutationState = {
  error?: string;
  success?: string;
  generatedCode?: string;
  generatedLink?: string;
};

const INITIAL_STATE: NetworkRebateMutationState = {};

function isMissingColumnError(message: string) {
  return /column .* does not exist/i.test(message);
}

function isMissingTableError(message: string) {
  return /relation .* does not exist/i.test(message);
}

async function updateNodeProfileWithPayloadAttempts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  nodeId: string,
  payloadAttempts: Array<Record<string, unknown>>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const keyAttempts = ["user_id", "id"] as const;
  let lastError = "Failed to update node profile.";

  for (const key of keyAttempts) {
    for (const payload of payloadAttempts) {
      const { data, error } = await supabase
        .from("users")
        .update(payload)
        .eq(key, nodeId)
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

function parseRate(rawRate: string) {
  const parsed = Number(rawRate);
  if (!Number.isFinite(parsed)) {
    return { error: "Rebate rate must be a valid number." };
  }

  if (parsed < 0 || parsed > 100) {
    return { error: "Rebate rate must be between 0 and 100." };
  }

  return { value: Number(parsed.toFixed(4)) };
}

function createReferralCode(nodeId: string) {
  const normalizedPrefix =
    nodeId
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(-6) || "IB";
  const randomPart = randomBytes(3).toString("hex").toUpperCase();
  return `${normalizedPrefix}-${randomPart}`;
}

function buildReferralLink(code: string, rawBaseUrl?: string) {
  const baseUrl = rawBaseUrl?.trim() || "https://portal.finhalo.com/register";
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}ref=${encodeURIComponent(code)}`;
}

export async function updateNetworkNodeRebateRateAction(
  _prevState: NetworkRebateMutationState = INITIAL_STATE,
  formData: FormData
): Promise<NetworkRebateMutationState> {
  void _prevState;
  const nodeId = String(formData.get("node_id") ?? "").trim();
  const rawRate = String(formData.get("rebate_rate") ?? "").trim();

  if (!nodeId) {
    return { error: "Node ID is required." };
  }

  if (!rawRate) {
    return { error: "Rebate rate is required." };
  }

  const parsedRate = parseRate(rawRate);
  if ("error" in parsedRate) {
    return { error: parsedRate.error };
  }

  const supabase = await createClient();
  const payloadAttempts: Array<Record<string, unknown>> = [
    { rebate_rate: parsedRate.value },
    { rebate_ratio: parsedRate.value },
    { ib_rebate_rate: parsedRate.value },
    { referral_rebate_rate: parsedRate.value },
  ];

  const updated = await updateNodeProfileWithPayloadAttempts(supabase, nodeId, payloadAttempts);
  if (!updated.ok) {
    return { error: updated.error };
  }

  revalidatePath("/admin/network");
  revalidatePath(`/admin/users/${nodeId}`);

  return {
    success: `Node ${nodeId} rebate rate updated to ${parsedRate.value}%.`,
  };
}

export async function generateNetworkNodeReferralAccessAction(
  _prevState: NetworkRebateMutationState = INITIAL_STATE,
  formData: FormData
): Promise<NetworkRebateMutationState> {
  void _prevState;
  const nodeId = String(formData.get("node_id") ?? "").trim();
  const baseUrl = String(formData.get("base_url") ?? "").trim();

  if (!nodeId) {
    return { error: "Node ID is required." };
  }

  const generatedCode = createReferralCode(nodeId);
  const generatedLink = buildReferralLink(generatedCode, baseUrl);
  const supabase = await createClient();
  const payloadAttempts: Array<Record<string, unknown>> = [
    {
      referral_code: generatedCode,
      referral_link: generatedLink,
    },
    {
      invite_code: generatedCode,
      invite_link: generatedLink,
    },
    {
      ib_referral_code: generatedCode,
      ib_referral_link: generatedLink,
    },
  ];

  const updated = await updateNodeProfileWithPayloadAttempts(supabase, nodeId, payloadAttempts);
  if (!updated.ok) {
    const { error: insertError } = await supabase.from("referral_codes").insert({
      ib_user_id: nodeId,
      code: generatedCode,
      link: generatedLink,
    });

    if (insertError && !isMissingTableError(insertError.message) && !isMissingColumnError(insertError.message)) {
      return { error: insertError.message };
    }

    if (insertError && updated.error) {
      return { error: updated.error };
    }
  }

  revalidatePath("/admin/network");
  revalidatePath(`/admin/users/${nodeId}`);

  return {
    success: `Node ${nodeId} referral access regenerated.`,
    generatedCode,
    generatedLink,
  };
}

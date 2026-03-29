"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { WithdrawalRow } from "../_types";

type WithdrawalActionState = {
  error?: string;
  success?: string;
};

type RpcTransitionResult = {
  withdrawal_id: string;
  previous_status: WithdrawalRow["status"] | null;
  status: WithdrawalRow["status"];
  reserve_ledger_ref: string | null;
  release_ledger_ref: string | null;
  payout_ledger_ref: string | null;
};

const WITHDRAWALS_PATH = "/admin/finance/withdrawals";
const SUPPORTED_CONTEXT_KEYS = [
  "query",
  "status",
  "user_id",
  "account_id",
  "currency",
  "payout_method",
  "date_from",
  "date_to",
] as const;
const WITHDRAWAL_STATUSES: WithdrawalRow["status"][] = [
  "requested",
  "under_review",
  "approved",
  "rejected",
  "processing",
  "completed",
  "failed",
  "cancelled",
];

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isWithdrawalStatus(value: string): value is WithdrawalRow["status"] {
  return WITHDRAWAL_STATUSES.includes(value as WithdrawalRow["status"]);
}

function buildContextQuery(formData: FormData): URLSearchParams {
  const params = new URLSearchParams();

  for (const key of SUPPORTED_CONTEXT_KEYS) {
    const value = getFormString(formData, key);
    if (value) {
      params.set(key, value);
    }
  }

  return params;
}

function revalidateWithdrawalSurfaces(formData: FormData) {
  revalidatePath(WITHDRAWALS_PATH);
  revalidatePath("/admin/finance");
  revalidatePath("/withdrawals");

  const contextQuery = buildContextQuery(formData).toString();
  if (contextQuery) {
    revalidatePath(`${WITHDRAWALS_PATH}?${contextQuery}`);
  }
}

function getTransitionLabel(status: WithdrawalRow["status"]) {
  switch (status) {
    case "under_review":
      return "moved to under_review";
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "processing":
      return "marked processing";
    case "completed":
      return "completed";
    case "failed":
      return "marked failed";
    case "cancelled":
      return "cancelled";
    default:
      return status;
  }
}

async function getActionActor() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const actor =
    user?.email?.trim() ||
    user?.user_metadata?.display_name?.toString().trim() ||
    user?.id?.trim() ||
    "admin";

  return { supabase, actor };
}

async function transitionWithdrawalStatus(
  formData: FormData,
  nextStatusOverride?: WithdrawalRow["status"]
): Promise<WithdrawalActionState> {
  const withdrawalId = getFormString(formData, "withdrawal_id");
  const nextStatusRaw = nextStatusOverride ?? getFormString(formData, "next_status");
  const reason = getFormString(formData, "reason") || null;
  const notes = getFormString(formData, "notes") || null;

  if (!withdrawalId) {
    return { error: "Unable to update withdrawal: missing withdrawal ID." };
  }

  if (!isWithdrawalStatus(nextStatusRaw)) {
    return { error: "Unable to update withdrawal: invalid target status." };
  }

  if ((nextStatusRaw === "rejected" || nextStatusRaw === "failed" || nextStatusRaw === "cancelled") && !reason) {
    return { error: "Reason is required for rejected, failed, or cancelled transitions." };
  }

  const { supabase, actor } = await getActionActor();
  const { data, error } = await supabase.rpc("admin_transition_withdrawal_request", {
    p_withdrawal_id: withdrawalId,
    p_next_status: nextStatusRaw,
    p_actor: actor,
    p_reason: reason,
    p_notes: notes,
  });

  if (error) {
    return { error: `Unable to update withdrawal ${withdrawalId}: ${error.message}` };
  }

  const transition = Array.isArray(data) ? (data[0] as RpcTransitionResult | undefined) : undefined;
  const finalStatus = transition?.status ?? nextStatusRaw;
  const previousStatus = transition?.previous_status;
  const context = [
    transition?.reserve_ledger_ref ? `reserve=${transition.reserve_ledger_ref}` : "",
    transition?.release_ledger_ref ? `release=${transition.release_ledger_ref}` : "",
    transition?.payout_ledger_ref ? `payout=${transition.payout_ledger_ref}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  revalidateWithdrawalSurfaces(formData);

  return {
    success: [
      `Withdrawal ${withdrawalId} ${getTransitionLabel(finalStatus)}.`,
      previousStatus ? `Previous status: ${previousStatus}.` : "",
      context ? `Ledger refs: ${context}.` : "",
    ]
      .filter(Boolean)
      .join(" "),
  };
}

export async function transitionWithdrawalStatusAction(
  _prevState: WithdrawalActionState,
  formData: FormData
): Promise<WithdrawalActionState> {
  return transitionWithdrawalStatus(formData);
}

export async function approveWithdrawalAction(
  _prevState: WithdrawalActionState,
  formData: FormData
): Promise<WithdrawalActionState> {
  return transitionWithdrawalStatus(formData, "approved");
}

export async function rejectWithdrawalAction(
  _prevState: WithdrawalActionState,
  formData: FormData
): Promise<WithdrawalActionState> {
  if (!getFormString(formData, "reason")) {
    formData.set("reason", "Rejected by admin review.");
  }
  return transitionWithdrawalStatus(formData, "rejected");
}

export async function batchApproveWithdrawalsAction(
  _prevState: WithdrawalActionState,
  _formData: FormData
): Promise<WithdrawalActionState> {
  void _prevState;
  void _formData;
  return {
    error:
      "Batch approve is disabled for withdrawal safety. Use row-level workflow transitions with audit context.",
  };
}

export async function batchRejectWithdrawalsAction(
  _prevState: WithdrawalActionState,
  _formData: FormData
): Promise<WithdrawalActionState> {
  void _prevState;
  void _formData;
  return {
    error:
      "Batch reject is disabled for withdrawal safety. Use row-level workflow transitions with audit context.",
  };
}

export async function updateWithdrawalGasFeeAction(
  _prevState: WithdrawalActionState,
  _formData: FormData
): Promise<WithdrawalActionState> {
  void _prevState;
  void _formData;
  return {
    error:
      "Direct gas fee mass update is removed from this workflow. Fees are captured per request and audited.",
  };
}

function parseWithdrawalIdsJson(formData: FormData): string[] {
  const raw = getFormString(formData, "withdrawal_ids_json");
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalized = parsed
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);

    return Array.from(new Set(normalized));
  } catch {
    return [];
  }
}

async function transitionSelectedWithdrawals(
  formData: FormData,
  targetStatus: Extract<WithdrawalRow["status"], "approved" | "rejected">
): Promise<WithdrawalActionState> {
  const withdrawalIds = parseWithdrawalIdsJson(formData);
  if (withdrawalIds.length === 0) {
    return { error: "Select at least one withdrawal before running a bulk transition." };
  }

  const reason = getFormString(formData, "reason");
  const notes = getFormString(formData, "notes");

  if (targetStatus === "rejected" && !reason) {
    return { error: "Reason is required for bulk rejection." };
  }

  const { supabase, actor } = await getActionActor();
  const failedIds: string[] = [];
  const succeededIds: string[] = [];

  for (const withdrawalId of withdrawalIds) {
    const payloadReason = targetStatus === "rejected" ? reason : reason || null;
    const { error } = await supabase.rpc("admin_transition_withdrawal_request", {
      p_withdrawal_id: withdrawalId,
      p_next_status: targetStatus,
      p_actor: actor,
      p_reason: payloadReason,
      p_notes: notes || null,
    });

    if (error) {
      failedIds.push(`${withdrawalId} (${error.message})`);
      continue;
    }

    succeededIds.push(withdrawalId);
  }

  revalidateWithdrawalSurfaces(formData);

  if (succeededIds.length === 0) {
    return {
      error: `No withdrawals were updated. ${failedIds.join(" | ")}`,
    };
  }

  if (failedIds.length > 0) {
    return {
      error: [
        `${succeededIds.length} withdrawal(s) updated to ${targetStatus}.`,
        `${failedIds.length} failed: ${failedIds.join(" | ")}`,
      ].join(" "),
    };
  }

  return {
    success: `${succeededIds.length} withdrawal(s) updated to ${targetStatus}.`,
  };
}

export async function bulkApproveSelectedWithdrawalsAction(
  _prevState: WithdrawalActionState,
  formData: FormData
): Promise<WithdrawalActionState> {
  return transitionSelectedWithdrawals(formData, "approved");
}

export async function bulkRejectSelectedWithdrawalsAction(
  _prevState: WithdrawalActionState,
  formData: FormData
): Promise<WithdrawalActionState> {
  return transitionSelectedWithdrawals(formData, "rejected");
}

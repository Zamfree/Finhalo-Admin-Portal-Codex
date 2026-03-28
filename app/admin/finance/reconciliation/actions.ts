"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type ReconciliationActionState = {
  error?: string;
  success?: string;
};

const RECONCILIATION_PATH = "/admin/finance/reconciliation";
const FINANCE_PATH = "/admin/finance";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function writeReconciliationAuditLog({
  action,
  details,
}: {
  action: string;
  details: string;
}) {
  try {
    const supabase = await createClient();
    const baseRow = {
      action,
      scope: "Finance / Reconciliation",
      actor: "Admin Operator",
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("admin_settings_audit").insert({
      ...baseRow,
      operation_key: "finance_reconciliation_exception",
      details,
    });

    if (error) {
      await supabase.from("admin_settings_audit").insert(baseRow);
    }
  } catch {
    // Keep guarded actions usable even when optional audit logging is unavailable.
  }
}

export async function queueReconciliationExceptionAction(
  _prevState: ReconciliationActionState,
  formData: FormData
): Promise<ReconciliationActionState> {
  const period = getFormString(formData, "period");
  const broker = getFormString(formData, "broker");
  const status = getFormString(formData, "status").toLowerCase();
  const note = getFormString(formData, "note");

  if (!period || !broker) {
    return { error: "Reconciliation period and broker context are required." };
  }

  if (status !== "review" && status !== "alert") {
    return { error: "Only review or alert reconciliation rows can queue exception handling." };
  }

  await writeReconciliationAuditLog({
    action: `Queued reconciliation exception handling (${status})`,
    details: JSON.stringify({
      period,
      broker,
      status,
      note: note || null,
    }),
  });

  revalidatePath(RECONCILIATION_PATH);
  revalidatePath(FINANCE_PATH);

  return {
    success: `Exception handling queued for ${broker} (${period}).`,
  };
}

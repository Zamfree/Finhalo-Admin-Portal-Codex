"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type SettingsActionState = {
  error?: string;
  success?: string;
};

export async function runSettingsOperationAction(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const operationKey = String(formData.get("operation_key") ?? "").trim();
  const operationTitle = String(formData.get("operation_title") ?? "").trim();
  const linkedModule = String(formData.get("linked_module") ?? "").trim();

  if (!operationKey || !operationTitle) {
    return { error: "Operation metadata is required." };
  }

  try {
    const supabase = await createClient();
    await supabase.from("admin_settings_audit").insert({
      action: `Triggered ${operationTitle}`,
      scope: linkedModule || "Settings",
      actor: "Admin Operator",
      created_at: new Date().toISOString(),
      operation_key: operationKey,
    });
  } catch {
    // Keep guarded actions usable even when the optional audit table is not available yet.
  }

  revalidatePath("/admin/settings");

  return {
    success: `${operationTitle} has been queued through the guarded settings action surface.`,
  };
}

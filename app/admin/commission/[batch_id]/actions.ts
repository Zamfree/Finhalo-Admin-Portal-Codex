"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ApprovalState = {
  error?: string;
  success?: string;
};

type BatchEnvironment = "live" | "test";

function normalizeEnvironment(value: unknown): BatchEnvironment {
  return value === "test" ? "test" : "live";
}

export async function approveBatchAction(
  _prevState: ApprovalState,
  formData: FormData,
): Promise<ApprovalState> {
  const batchId = String(formData.get("batch_id") ?? "").trim();

  if (!batchId) {
    return { error: "Batch ID is required." };
  }

  const supabase = await createClient();

  const { data: batch, error: batchLookupError } = await supabase
    .from("commission_batches")
    .select("batch_id, environment")
    .eq("batch_id", batchId)
    .maybeSingle();

  if (batchLookupError) {
    return { error: batchLookupError.message };
  }

  if (!batch) {
    return { error: `Batch ${batchId} was not found.` };
  }

  const environment = normalizeEnvironment((batch as { environment?: unknown }).environment);

  if (environment === "test") {
    const { error: updateError } = await supabase
      .from("commission_batches")
      .update({ status: "confirmed" })
      .eq("batch_id", batchId);

    if (updateError) {
      return { error: updateError.message };
    }

    revalidatePath(`/admin/commission/batches/${batchId}`);
    revalidatePath("/admin/commission/batches");

    return {
      success: `Batch ${batchId} approved in test mode. No live ledger entries were written.`,
    };
  }

  const { error } = await supabase.rpc("approve_batch", {
    batch_id: batchId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/commission/batches/${batchId}`);
  revalidatePath("/admin/commission/batches");

  return { success: `Batch ${batchId} approved successfully.` };
}

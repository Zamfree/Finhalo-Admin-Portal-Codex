"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer } from "@/lib/supabase/server";

type ApprovalState = {
  error?: string;
  success?: string;
};

export async function approveBatchAction(
  _prevState: ApprovalState,
  formData: FormData,
): Promise<ApprovalState> {
  const batchId = String(formData.get("batch_id") ?? "").trim();

  if (!batchId) {
    return { error: "Batch ID is required." };
  }

  const { error } = await supabaseServer.rpc("approve_batch", {
    batch_id: batchId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/commissions/${batchId}`);
  revalidatePath("/admin/commissions");

  return { success: `Batch ${batchId} approved successfully.` };
}

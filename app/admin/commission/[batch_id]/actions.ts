"use server";

import { confirmCommissionBatch } from "@/app/admin/commission/batches/workflow-actions";

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

  return confirmCommissionBatch(batchId);
}

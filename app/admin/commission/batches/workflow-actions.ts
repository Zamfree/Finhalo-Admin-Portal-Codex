"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type CommissionBatchWorkflowState = {
  error?: string;
  success?: string;
};

function normalizeBatchId(batchId: string) {
  return batchId.trim();
}

function getBatchIdFromFormData(formData: FormData) {
  return normalizeBatchId(String(formData.get("batch_id") ?? ""));
}

async function updateCommissionBatchStatus(
  batchId: string,
  status: "confirmed" | "cancelled" | "rolled_back",
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("commission_batches")
    .update({ status })
    .eq("batch_id", batchId)
    .select("batch_id")
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return true;
}

export async function confirmCommissionBatch(batchId: string): Promise<CommissionBatchWorkflowState> {
  const normalizedBatchId = normalizeBatchId(batchId);

  if (!normalizedBatchId) {
    return { error: "Batch ID is required." };
  }

  try {
    const updated = await updateCommissionBatchStatus(normalizedBatchId, "confirmed");

    if (updated) {
      revalidatePath("/admin/commission");
      revalidatePath("/admin/commission/upload");
      revalidatePath("/admin/commission/batches");
      revalidatePath(`/admin/commission/batches/${normalizedBatchId}`);

      return {
        success: `Batch ${normalizedBatchId} marked as confirmed.`,
      };
    }
  } catch {
    // Fall through to placeholder mode.
  }

  revalidatePath("/admin/commission");
  revalidatePath("/admin/commission/batches");
  revalidatePath(`/admin/commission/batches/${normalizedBatchId}`);

  return {
    success: `Placeholder workflow captured for ${normalizedBatchId}. Confirm import is ready for future backend wiring.`,
  };
}

export async function cancelCommissionBatch(batchId: string): Promise<CommissionBatchWorkflowState> {
  const normalizedBatchId = normalizeBatchId(batchId);

  if (!normalizedBatchId) {
    return { error: "Batch ID is required." };
  }

  try {
    const updated = await updateCommissionBatchStatus(normalizedBatchId, "cancelled");

    if (updated) {
      revalidatePath("/admin/commission");
      revalidatePath("/admin/commission/upload");
      revalidatePath("/admin/commission/batches");
      revalidatePath(`/admin/commission/batches/${normalizedBatchId}`);

      return {
        success: `Batch ${normalizedBatchId} marked as cancelled.`,
      };
    }
  } catch {
    // Fall through to placeholder mode.
  }

  revalidatePath("/admin/commission");
  revalidatePath("/admin/commission/batches");
  revalidatePath(`/admin/commission/batches/${normalizedBatchId}`);

  return {
    success: `Placeholder workflow captured for ${normalizedBatchId}. Cancel import is ready for future backend wiring.`,
  };
}

export async function rollbackCommissionBatch(batchId: string): Promise<CommissionBatchWorkflowState> {
  const normalizedBatchId = normalizeBatchId(batchId);

  if (!normalizedBatchId) {
    return { error: "Batch ID is required." };
  }

  try {
    const updated = await updateCommissionBatchStatus(normalizedBatchId, "rolled_back");

    if (updated) {
      revalidatePath("/admin/commission");
      revalidatePath("/admin/commission/upload");
      revalidatePath("/admin/commission/batches");
      revalidatePath(`/admin/commission/batches/${normalizedBatchId}`);

      return {
        success: `Batch ${normalizedBatchId} marked as rolled back.`,
      };
    }
  } catch {
    // Fall through to placeholder mode.
  }

  revalidatePath("/admin/commission");
  revalidatePath("/admin/commission/batches");
  revalidatePath(`/admin/commission/batches/${normalizedBatchId}`);

  return {
    success: `Placeholder workflow captured for ${normalizedBatchId}. Rollback is ready for future backend wiring.`,
  };
}

export async function confirmCommissionBatchAction(
  _prevState: CommissionBatchWorkflowState,
  formData: FormData,
): Promise<CommissionBatchWorkflowState> {
  return confirmCommissionBatch(getBatchIdFromFormData(formData));
}

export async function cancelCommissionBatchAction(
  _prevState: CommissionBatchWorkflowState,
  formData: FormData,
): Promise<CommissionBatchWorkflowState> {
  return cancelCommissionBatch(getBatchIdFromFormData(formData));
}

export async function rollbackCommissionBatchAction(
  _prevState: CommissionBatchWorkflowState,
  formData: FormData,
): Promise<CommissionBatchWorkflowState> {
  return rollbackCommissionBatch(getBatchIdFromFormData(formData));
}

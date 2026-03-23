"use server";

import { revalidatePath } from "next/cache";

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

export async function confirmCommissionBatch(batchId: string): Promise<CommissionBatchWorkflowState> {
  const normalizedBatchId = normalizeBatchId(batchId);

  if (!normalizedBatchId) {
    return { error: "Batch ID is required." };
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

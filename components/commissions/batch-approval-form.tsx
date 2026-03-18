"use client";

import { useActionState } from "react";

import { approveBatchAction } from "@/app/admin/commissions/[batch_id]/actions";

type ApprovalState = {
  error?: string;
  success?: string;
};

const INITIAL_STATE: ApprovalState = {};

type BatchApprovalFormProps = {
  batchId: string;
  disabled?: boolean;
};

export function BatchApprovalForm({ batchId, disabled = false }: BatchApprovalFormProps) {
  const [state, formAction, isPending] = useActionState(approveBatchAction, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="batch_id" value={batchId} />

      <button
        type="submit"
        disabled={disabled || isPending}
        className="rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Approving..." : "Approve Batch"}
      </button>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-600">{state.success}</p> : null}
    </form>
  );
}

"use client";

import { useActionState } from "react";

import { approveBatchAction } from "@/app/admin/commission/[batch_id]/actions";

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
        className="admin-interactive rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Approving..." : "Approve Batch"}
      </button>

      {state.error ? <p className="text-sm text-rose-300">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-300">{state.success}</p> : null}
    </form>
  );
}

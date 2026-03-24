"use client";

import Link from "next/link";
import { useActionState } from "react";

import { AdminButton } from "@/components/system/actions/admin-button";

import {
  cancelCommissionBatchAction,
  confirmCommissionBatchAction,
  rollbackCommissionBatchAction,
  type CommissionBatchWorkflowState,
} from "./workflow-actions";

const INITIAL_STATE: CommissionBatchWorkflowState = {};

type BatchWorkflowActionsProps = {
  batchId: string;
  isLocked: boolean;
  isReady: boolean;
  needsReview: boolean;
  showViewDetail?: boolean;
  showExportButton?: boolean;
  align?: "left" | "right";
  buttonClassName?: string;
  helperTextClassName?: string;
};

export function BatchWorkflowActions({
  batchId,
  isLocked,
  isReady,
  needsReview,
  showViewDetail = false,
  showExportButton = false,
  align = "left",
  buttonClassName = "h-11 px-5",
  helperTextClassName = "text-xs",
}: BatchWorkflowActionsProps) {
  const [confirmState, confirmFormAction, isConfirmPending] = useActionState(
    confirmCommissionBatchAction,
    INITIAL_STATE,
  );
  const [cancelState, cancelFormAction, isCancelPending] = useActionState(
    cancelCommissionBatchAction,
    INITIAL_STATE,
  );
  const [rollbackState, rollbackFormAction, isRollbackPending] = useActionState(
    rollbackCommissionBatchAction,
    INITIAL_STATE,
  );

  const isPending = isConfirmPending || isCancelPending || isRollbackPending;
  const alignmentClass = align === "right" ? "justify-end" : "justify-start";
  const helperToneClass = isLocked
    ? "text-zinc-500"
    : needsReview
      ? "text-amber-300"
      : "text-zinc-400";

  return (
    <div className="space-y-2">
      <div className={`flex flex-wrap items-center gap-2 ${alignmentClass}`}>
        {showViewDetail ? (
          <Link href={`/admin/commission/batches/${batchId}`}>
            <AdminButton variant="ghost" className={buttonClassName}>
              View Detail
            </AdminButton>
          </Link>
        ) : null}

        <form action={confirmFormAction}>
          <input type="hidden" name="batch_id" value={batchId} />
          <AdminButton
            type="submit"
            variant="primary"
            className={buttonClassName}
            disabled={isLocked || needsReview || !isReady || isPending}
          >
            {isConfirmPending ? "Posting..." : "Approve & Post"}
          </AdminButton>
        </form>

        {showExportButton ? (
          <AdminButton variant="ghost" className={buttonClassName} disabled={isPending}>
            Export CSV
          </AdminButton>
        ) : null}

        <form action={cancelFormAction}>
          <input type="hidden" name="batch_id" value={batchId} />
          <AdminButton
            type="submit"
            variant="ghost"
            className={buttonClassName}
            disabled={isLocked || isPending}
          >
            {isCancelPending ? "Cancelling..." : "Cancel Import"}
          </AdminButton>
        </form>

        <form action={rollbackFormAction}>
          <input type="hidden" name="batch_id" value={batchId} />
          <AdminButton
            type="submit"
            variant="destructive"
            className={buttonClassName}
            disabled={!isLocked || isPending}
          >
            {isRollbackPending ? "Rolling Back..." : "Rollback Batch"}
          </AdminButton>
        </form>
      </div>

      <p className={`${helperTextClassName} ${helperToneClass}`}>
        {isLocked
          ? "Batch finalized. Rollback is available if reversal is required."
          : needsReview
            ? "Approval disabled. Resolve validation errors and duplicate issues first."
            : "Ready for approval. This will generate rebate records and post ledger entries."}
      </p>

      <p className={`${helperTextClassName} text-zinc-500`}>
        Approve & Post will generate rebate records and write to finance ledger. Cancel Import stops the current workflow. Rollback Batch reverses a finalized batch at workflow level.
      </p>

      {confirmState.error ? <p className="text-xs text-rose-300">{confirmState.error}</p> : null}
      {cancelState.error ? <p className="text-xs text-rose-300">{cancelState.error}</p> : null}
      {rollbackState.error ? <p className="text-xs text-rose-300">{rollbackState.error}</p> : null}

      {confirmState.success ? <p className="text-xs text-emerald-300">{confirmState.success}</p> : null}
      {cancelState.success ? <p className="text-xs text-emerald-300">{cancelState.success}</p> : null}
      {rollbackState.success ? <p className="text-xs text-emerald-300">{rollbackState.success}</p> : null}
    </div>
  );
}
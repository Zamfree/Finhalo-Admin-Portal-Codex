"use client";

import { type ReactNode, useActionState } from "react";
import { ArrowUpRight, RotateCcw, X } from "lucide-react";

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
  guardrailBlocked?: boolean;
  mode?: "queue" | "detail";
  onOpen?: () => void;
};

function SecondaryActionButton({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white/[0.06] hover:text-white focus-visible:bg-white/[0.06] focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 ${className}`}
    >
      {children}
    </button>
  );
}

export function BatchWorkflowActions({
  batchId,
  isLocked,
  isReady,
  needsReview,
  guardrailBlocked = false,
  mode = "detail",
  onOpen,
}: BatchWorkflowActionsProps) {
  const [confirmState, confirmFormAction, isConfirmPending] = useActionState(
    confirmCommissionBatchAction,
    INITIAL_STATE
  );
  const [cancelState, cancelFormAction, isCancelPending] = useActionState(
    cancelCommissionBatchAction,
    INITIAL_STATE
  );
  const [rollbackState, rollbackFormAction, isRollbackPending] = useActionState(
    rollbackCommissionBatchAction,
    INITIAL_STATE
  );

  const isPending = isConfirmPending || isCancelPending || isRollbackPending;
  const statusMessage =
    confirmState.error ??
    cancelState.error ??
    rollbackState.error ??
    confirmState.success ??
    cancelState.success ??
    rollbackState.success;
  const statusTone =
    confirmState.error || cancelState.error || rollbackState.error
      ? "text-rose-300"
      : "text-emerald-300";

  if (mode === "queue") {
    return (
      <div
        className="group/action flex items-center justify-end gap-2"
        onClick={(event) => event.stopPropagation()}
      >
        {isReady && !isLocked ? (
          <form action={confirmFormAction}>
            <input type="hidden" name="batch_id" value={batchId} />
            <AdminButton
              type="submit"
              variant="primary"
              className="h-9 px-4"
              disabled={isPending || guardrailBlocked}
            >
              {isConfirmPending ? "Posting..." : "Approve & Post"}
            </AdminButton>
          </form>
        ) : (
          <AdminButton variant="ghost" className="h-9 px-4" onClick={onOpen}>
            {isLocked ? "Open" : "Review"}
          </AdminButton>
        )}

        <div className="flex items-center gap-1 opacity-0 transition group-hover/action:opacity-100 group-focus-within/action:opacity-100">
          {onOpen ? (
            <button
              type="button"
              aria-label="Open drawer"
              title="Open drawer"
              onClick={onOpen}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white/[0.06] hover:text-white focus-visible:bg-white/[0.06] focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
            >
              <ArrowUpRight size={14} />
            </button>
          ) : null}

          {!isLocked ? (
            <form action={cancelFormAction}>
              <input type="hidden" name="batch_id" value={batchId} />
              <SecondaryActionButton label="Cancel import">
                <X size={14} />
              </SecondaryActionButton>
            </form>
          ) : null}

          {isLocked ? (
            <form action={rollbackFormAction}>
              <input type="hidden" name="batch_id" value={batchId} />
              <SecondaryActionButton
                label="Rollback batch"
                className="text-rose-300 hover:text-rose-200"
              >
                <RotateCcw size={14} />
              </SecondaryActionButton>
            </form>
          ) : null}
        </div>

        {statusMessage ? (
          <p className={`sr-only break-words ${statusTone}`} aria-live="polite">
            {statusMessage}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <form action={confirmFormAction}>
          <input type="hidden" name="batch_id" value={batchId} />
          <AdminButton
            type="submit"
            variant="primary"
            className="h-11 px-5"
            disabled={isLocked || needsReview || !isReady || isPending || guardrailBlocked}
          >
            {isConfirmPending ? "Posting..." : "Approve & Post"}
          </AdminButton>
        </form>

        <form action={cancelFormAction}>
          <input type="hidden" name="batch_id" value={batchId} />
          <AdminButton
            type="submit"
            variant="ghost"
            className="h-11 px-5"
            disabled={isLocked || isPending}
          >
            {isCancelPending ? "Cancelling..." : "Cancel"}
          </AdminButton>
        </form>

        <form action={rollbackFormAction}>
          <input type="hidden" name="batch_id" value={batchId} />
          <AdminButton
            type="submit"
            variant="destructive"
            className="h-11 px-5"
            disabled={!isLocked || isPending}
          >
            {isRollbackPending ? "Rolling Back..." : "Rollback"}
          </AdminButton>
        </form>
      </div>

      {statusMessage ? (
        <p className={`break-words text-xs ${statusTone}`} aria-live="polite">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}

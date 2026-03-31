"use client";

import { useActionState } from "react";

import { AdminButton } from "@/components/system/actions/admin-button";

import {
  cancelCommissionBatchAction,
  clearCommissionBatchDuplicateReviewAction,
  completeCommissionBatchSimulationAction,
  confirmCommissionBatchMappingAction,
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
  simulationCompleted?: boolean;
  simulationEligible?: boolean;
  mappingReviewPending?: boolean;
  duplicateReviewPending?: boolean;
  mode?: "queue" | "detail";
  onOpen?: () => void;
};

export function BatchWorkflowActions({
  batchId,
  isLocked,
  isReady,
  needsReview,
  guardrailBlocked = false,
  simulationCompleted = false,
  simulationEligible = false,
  mappingReviewPending = false,
  duplicateReviewPending = false,
  mode = "detail",
  onOpen,
}: BatchWorkflowActionsProps) {
  const [simulationState, simulationFormAction, isSimulationPending] = useActionState(
    completeCommissionBatchSimulationAction,
    INITIAL_STATE
  );
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
  const [duplicateState, duplicateFormAction, isDuplicatePending] = useActionState(
    clearCommissionBatchDuplicateReviewAction,
    INITIAL_STATE
  );
  const [mappingState, mappingFormAction, isMappingPending] = useActionState(
    confirmCommissionBatchMappingAction,
    INITIAL_STATE
  );

  const isPending =
    isSimulationPending ||
    isConfirmPending ||
    isCancelPending ||
    isRollbackPending ||
    isDuplicatePending ||
    isMappingPending;
  const statusMessage =
    mappingState.error ??
    mappingState.success ??
    duplicateState.error ??
    duplicateState.success ??
    simulationState.error ??
    simulationState.success ??
    confirmState.error ??
    cancelState.error ??
    rollbackState.error ??
    confirmState.success ??
    cancelState.success ??
    rollbackState.success;
  const statusTone =
    duplicateState.error ||
    mappingState.error ||
    simulationState.error ||
    confirmState.error ||
    cancelState.error ||
    rollbackState.error
      ? "text-rose-300"
      : "text-emerald-300";

  function confirmAction(
    event: { preventDefault: () => void },
    prompt: string
  ) {
    if (!window.confirm(prompt)) {
      event.preventDefault();
    }
  }

  if (mode === "queue") {
    return (
      <div
        className="flex items-center justify-end gap-2"
        onClick={(event) => event.stopPropagation()}
      >
        {isReady && !isLocked ? (
          <form action={confirmFormAction}>
            <input type="hidden" name="batch_id" value={batchId} />
            <AdminButton
              type="submit"
              variant="primary"
              className="h-9 whitespace-nowrap px-4"
              disabled={isPending || guardrailBlocked}
              title={statusMessage}
            >
              {isConfirmPending ? "Posting..." : "Approve & Post"}
            </AdminButton>
          </form>
        ) : mappingReviewPending && !isLocked ? (
          <form action={mappingFormAction}>
            <input type="hidden" name="batch_id" value={batchId} />
            <AdminButton
              type="submit"
              variant="secondary"
              className="h-9 whitespace-nowrap px-4"
              disabled={isPending}
              title={statusMessage}
            >
              {isMappingPending ? "Confirming..." : "Confirm Mapping"}
            </AdminButton>
          </form>
        ) : duplicateReviewPending && !isLocked ? (
          <form action={duplicateFormAction}>
            <input type="hidden" name="batch_id" value={batchId} />
            <AdminButton
              type="submit"
              variant="secondary"
              className="h-9 whitespace-nowrap px-4"
              disabled={isPending}
              title={statusMessage}
            >
              {isDuplicatePending ? "Clearing..." : "Mark Duplicate Clear"}
            </AdminButton>
          </form>
        ) : !simulationCompleted && !isLocked ? (
          <form action={simulationFormAction}>
            <input type="hidden" name="batch_id" value={batchId} />
            <AdminButton
              type="submit"
              variant="secondary"
              className="h-9 whitespace-nowrap px-4"
              disabled={isPending || !simulationEligible}
              title={statusMessage}
            >
              {isSimulationPending ? "Marking..." : "Complete Simulation"}
            </AdminButton>
          </form>
        ) : (
          <AdminButton variant="ghost" className="h-9 whitespace-nowrap px-4" onClick={onOpen}>
            {isLocked ? "Open" : "Review"}
          </AdminButton>
        )}

        {onOpen ? (
          <AdminButton type="button" variant="ghost" onClick={onOpen} className="h-9 whitespace-nowrap px-3">
            Open
          </AdminButton>
        ) : null}

        {statusMessage ? <p className={`sr-only ${statusTone}`}>{statusMessage}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {mappingReviewPending ? (
          <form action={mappingFormAction}>
            <input type="hidden" name="batch_id" value={batchId} />
            <AdminButton type="submit" variant="secondary" className="h-11 px-5" disabled={isLocked || isPending}>
              {isMappingPending ? "Confirming..." : "Confirm Mapping"}
            </AdminButton>
          </form>
        ) : null}

        {!simulationCompleted ? (
          <form action={simulationFormAction}>
            <input type="hidden" name="batch_id" value={batchId} />
            <AdminButton
              type="submit"
              variant="secondary"
              className="h-11 px-5"
              disabled={isLocked || isPending || !simulationEligible}
            >
              {isSimulationPending ? "Marking..." : "Complete Simulation"}
            </AdminButton>
          </form>
        ) : null}

        {duplicateReviewPending ? (
          <form action={duplicateFormAction}>
            <input type="hidden" name="batch_id" value={batchId} />
            <AdminButton type="submit" variant="secondary" className="h-11 px-5" disabled={isLocked || isPending}>
              {isDuplicatePending ? "Clearing..." : "Mark Duplicate Clear"}
            </AdminButton>
          </form>
        ) : null}

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

        <form
          action={cancelFormAction}
          onSubmit={(event) =>
            confirmAction(event, "Cancel this import batch? This action cannot be undone from the detail view.")
          }
        >
          <input type="hidden" name="batch_id" value={batchId} />
          <AdminButton
            type="submit"
            variant="ghost"
            className="h-11 px-5"
            disabled={isLocked || isPending}
            title="Cancel import before posting."
          >
            {isCancelPending ? "Cancelling..." : "Cancel"}
          </AdminButton>
        </form>

        <form
          action={rollbackFormAction}
          onSubmit={(event) =>
            confirmAction(event, "Rollback this posted batch? This will affect downstream ledger visibility.")
          }
        >
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

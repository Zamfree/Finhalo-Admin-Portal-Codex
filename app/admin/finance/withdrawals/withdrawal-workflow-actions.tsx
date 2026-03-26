"use client";

import { useActionState } from "react";

import { AdminButton } from "@/components/system/actions/admin-button";

import { approveWithdrawalAction, rejectWithdrawalAction } from "./actions";

type WithdrawalActionState = {
  error?: string;
  success?: string;
};

const INITIAL_STATE: WithdrawalActionState = {};

export function WithdrawalWorkflowActions({
  withdrawalId,
  status,
  compact = false,
}: {
  withdrawalId: string;
  status: "pending" | "approved" | "rejected";
  compact?: boolean;
}) {
  const [approveState, approveFormAction, isApprovePending] = useActionState(
    approveWithdrawalAction,
    INITIAL_STATE
  );
  const [rejectState, rejectFormAction, isRejectPending] = useActionState(
    rejectWithdrawalAction,
    INITIAL_STATE
  );

  const isPending = isApprovePending || isRejectPending;
  const isActionable = status === "pending";
  const buttonClassName = compact ? "px-3 py-2" : "h-11 px-5";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        <form action={approveFormAction}>
          <input type="hidden" name="withdrawal_id" value={withdrawalId} />
          <AdminButton
            type="submit"
            variant="primary"
            className={buttonClassName}
            disabled={!isActionable || isPending}
          >
            {isApprovePending ? "Approving..." : "Approve"}
          </AdminButton>
        </form>

        <form action={rejectFormAction}>
          <input type="hidden" name="withdrawal_id" value={withdrawalId} />
          <AdminButton
            type="submit"
            variant="destructive"
            className={buttonClassName}
            disabled={!isActionable || isPending}
          >
            {isRejectPending ? "Rejecting..." : "Reject"}
          </AdminButton>
        </form>
      </div>

      {status !== "pending" ? (
        <p className="break-words text-xs text-zinc-500">
          This withdrawal is already {status}. Only pending withdrawals can be actioned here.
        </p>
      ) : null}

      {approveState.error ? (
        <p className="break-words text-xs text-rose-300" aria-live="polite">
          {approveState.error}
        </p>
      ) : null}
      {rejectState.error ? (
        <p className="break-words text-xs text-rose-300" aria-live="polite">
          {rejectState.error}
        </p>
      ) : null}
      {approveState.success ? (
        <p className="break-words text-xs text-emerald-300" aria-live="polite">
          {approveState.success}
        </p>
      ) : null}
      {rejectState.success ? (
        <p className="break-words text-xs text-emerald-300" aria-live="polite">
          {rejectState.success}
        </p>
      ) : null}
    </div>
  );
}

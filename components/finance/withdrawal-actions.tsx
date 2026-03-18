"use client";

import { useActionState } from "react";

import { approveWithdrawalAction, rejectWithdrawalAction } from "@/app/admin/finance/withdrawals/actions";

type WithdrawalActionState = {
  error?: string;
  success?: string;
};

const INITIAL_STATE: WithdrawalActionState = {};

type WithdrawalActionsProps = {
  withdrawalId: string;
  status: string;
};

export function WithdrawalActions({ withdrawalId, status }: WithdrawalActionsProps) {
  const isPendingStatus = status === "pending";

  const [approveState, approveFormAction, isApprovePending] = useActionState(
    approveWithdrawalAction,
    INITIAL_STATE,
  );
  const [rejectState, rejectFormAction, isRejectPending] = useActionState(rejectWithdrawalAction, INITIAL_STATE);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <form action={approveFormAction}>
          <input type="hidden" name="withdrawal_id" value={withdrawalId} />
          <button
            type="submit"
            disabled={!isPendingStatus || isApprovePending || isRejectPending}
            className="rounded-md border px-2 py-1 text-xs hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isApprovePending ? "Approving..." : "Approve"}
          </button>
        </form>

        <form action={rejectFormAction}>
          <input type="hidden" name="withdrawal_id" value={withdrawalId} />
          <button
            type="submit"
            disabled={!isPendingStatus || isApprovePending || isRejectPending}
            className="rounded-md border px-2 py-1 text-xs hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRejectPending ? "Rejecting..." : "Reject"}
          </button>
        </form>
      </div>

      {approveState.error ? <p className="text-xs text-destructive">{approveState.error}</p> : null}
      {rejectState.error ? <p className="text-xs text-destructive">{rejectState.error}</p> : null}
      {approveState.success ? <p className="text-xs text-green-600">{approveState.success}</p> : null}
      {rejectState.success ? <p className="text-xs text-green-600">{rejectState.success}</p> : null}
    </div>
  );
}

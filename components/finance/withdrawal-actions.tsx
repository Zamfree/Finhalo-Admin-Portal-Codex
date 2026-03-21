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
            className="admin-interactive rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isApprovePending ? "Approving..." : "Approve"}
          </button>
        </form>

        <form action={rejectFormAction}>
          <input type="hidden" name="withdrawal_id" value={withdrawalId} />
          <button
            type="submit"
            disabled={!isPendingStatus || isApprovePending || isRejectPending}
            className="admin-interactive-soft rounded-xl border border-white/10 bg-transparent px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRejectPending ? "Rejecting..." : "Reject"}
          </button>
        </form>
      </div>

      {approveState.error ? <p className="text-xs text-rose-300">{approveState.error}</p> : null}
      {rejectState.error ? <p className="text-xs text-rose-300">{rejectState.error}</p> : null}
      {approveState.success ? <p className="text-xs text-emerald-300">{approveState.success}</p> : null}
      {rejectState.success ? <p className="text-xs text-emerald-300">{rejectState.success}</p> : null}
    </div>
  );
}

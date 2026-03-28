"use client";

import { useActionState } from "react";

import { AdminButton } from "@/components/system/actions/admin-button";

import {
  batchApproveWithdrawalsAction,
  batchRejectWithdrawalsAction,
  updateWithdrawalGasFeeAction,
} from "./actions";

type WithdrawalActionState = {
  error?: string;
  success?: string;
};

const INITIAL_STATE: WithdrawalActionState = {};

export function WithdrawalsOperationsBar({
  networkOptions,
  defaultNetwork,
  defaultFee,
  batchApproveLabel,
  batchRejectLabel,
  updateLabel,
}: {
  networkOptions: string[];
  defaultNetwork: string;
  defaultFee: number;
  batchApproveLabel: string;
  batchRejectLabel: string;
  updateLabel: string;
}) {
  const [batchApproveState, batchApproveAction, isBatchApprovePending] = useActionState(
    batchApproveWithdrawalsAction,
    INITIAL_STATE
  );
  const [batchRejectState, batchRejectAction, isBatchRejectPending] = useActionState(
    batchRejectWithdrawalsAction,
    INITIAL_STATE
  );
  const [gasFeeState, gasFeeAction, isGasFeePending] = useActionState(
    updateWithdrawalGasFeeAction,
    INITIAL_STATE
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <form action={batchApproveAction}>
          <AdminButton
            type="submit"
            variant="secondary"
            className="h-11 px-5"
            disabled={isBatchApprovePending || isBatchRejectPending}
          >
            {isBatchApprovePending ? "Approving..." : batchApproveLabel}
          </AdminButton>
        </form>
        <form action={batchRejectAction}>
          <AdminButton
            type="submit"
            variant="destructive"
            className="h-11 px-5"
            disabled={isBatchApprovePending || isBatchRejectPending}
          >
            {isBatchRejectPending ? "Rejecting..." : batchRejectLabel}
          </AdminButton>
        </form>
      </div>

      {batchApproveState.error ? (
        <p className="break-words text-xs text-rose-300" aria-live="polite">
          {batchApproveState.error}
        </p>
      ) : null}
      {batchApproveState.success ? (
        <p className="break-words text-xs text-emerald-300" aria-live="polite">
          {batchApproveState.success}
        </p>
      ) : null}
      {batchRejectState.error ? (
        <p className="break-words text-xs text-rose-300" aria-live="polite">
          {batchRejectState.error}
        </p>
      ) : null}
      {batchRejectState.success ? (
        <p className="break-words text-xs text-emerald-300" aria-live="polite">
          {batchRejectState.success}
        </p>
      ) : null}

      <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
        <form action={gasFeeAction} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px] space-y-1.5">
            <label
              htmlFor="gas_fee"
              className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
            >
              Gas Fee
            </label>
            <input
              id="gas_fee"
              name="gas_fee"
              type="number"
              min="0"
              step="0.01"
              defaultValue={defaultFee.toFixed(2)}
              className="admin-control h-10 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none"
            />
          </div>

          <div className="min-w-[160px] space-y-1.5">
            <label
              htmlFor="network"
              className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
            >
              Network
            </label>
            <select
              id="network"
              name="network"
              defaultValue={defaultNetwork}
              className="admin-control h-10 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none"
            >
              {networkOptions.map((network) => (
                <option key={network} value={network}>
                  {network}
                </option>
              ))}
            </select>
          </div>

          <AdminButton type="submit" variant="secondary" className="h-10 px-4" disabled={isGasFeePending}>
            {isGasFeePending ? "Updating..." : updateLabel}
          </AdminButton>
        </form>
        {gasFeeState.error ? (
          <p className="mt-2 break-words text-xs text-rose-300" aria-live="polite">
            {gasFeeState.error}
          </p>
        ) : null}
        {gasFeeState.success ? (
          <p className="mt-2 break-words text-xs text-emerald-300" aria-live="polite">
            {gasFeeState.success}
          </p>
        ) : null}
      </div>
    </div>
  );
}

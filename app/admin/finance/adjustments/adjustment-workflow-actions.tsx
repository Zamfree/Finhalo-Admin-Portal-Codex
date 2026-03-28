"use client";

import { useActionState } from "react";

import { AdminButton } from "@/components/system/actions/admin-button";

import {
  queueBatchAdjustmentAction,
  queueSingleAdjustmentAction,
} from "./actions";

type AdjustmentActionState = {
  error?: string;
  success?: string;
};

const INITIAL_STATE: AdjustmentActionState = {};

export function AdjustmentWorkflowActions() {
  const [singleState, singleFormAction, isSinglePending] = useActionState(
    queueSingleAdjustmentAction,
    INITIAL_STATE
  );
  const [batchState, batchFormAction, isBatchPending] = useActionState(
    queueBatchAdjustmentAction,
    INITIAL_STATE
  );

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Single Adjustment
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Post a single credit/debit adjustment directly to finance ledger.
        </p>

        <form action={singleFormAction} className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-4">
            <label className="space-y-1.5 text-xs text-zinc-500">
              Adjustment Type
              <select
                name="adjustment_type"
                defaultValue="credit"
                className="admin-control h-10 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none"
              >
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
            </label>
            <label className="space-y-1.5 text-xs text-zinc-500">
              User ID (Optional)
              <input
                name="user_id"
                type="text"
                className="admin-control h-10 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                placeholder="USR-1001"
              />
            </label>
            <label className="space-y-1.5 text-xs text-zinc-500">
              Account ID (Optional)
              <input
                name="account_id"
                type="text"
                className="admin-control h-10 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                placeholder="ACC-2001"
              />
            </label>
            <label className="space-y-1.5 text-xs text-zinc-500">
              Amount
              <input
                name="amount"
                type="number"
                min="0.00000001"
                step="0.00000001"
                required
                className="admin-control h-10 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                placeholder="35.00"
              />
            </label>
          </div>

          <label className="block space-y-1.5 text-xs text-zinc-500">
            Reason
            <textarea
              name="reason"
              required
              rows={3}
              className="admin-control w-full rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
              placeholder="Explain why this adjustment should be posted."
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <AdminButton type="submit" variant="primary" className="h-10 px-4" disabled={isSinglePending}>
              {isSinglePending ? "Posting..." : "Post Single Adjustment"}
            </AdminButton>
            <p className="text-xs text-zinc-500">Requires a valid user_id or account_id mapping.</p>
          </div>

          {singleState.error ? (
            <p className="break-words text-sm text-rose-300" aria-live="polite">
              {singleState.error}
            </p>
          ) : null}
          {singleState.success ? (
            <p className="break-words text-sm text-emerald-300" aria-live="polite">
              {singleState.success}
            </p>
          ) : null}
        </form>
      </section>

      <section className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Batch Adjustment
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Execute grouped adjustments in one batch run.
        </p>

        <form action={batchFormAction} className="mt-4 space-y-3">
          <label className="block space-y-1.5 text-xs text-zinc-500">
            Batch Reference
            <input
              name="batch_reference"
              type="text"
              required
              className="admin-control h-10 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
              placeholder="ADJ-BATCH-2026-03-27-A"
            />
          </label>
          <label className="block space-y-1.5 text-xs text-zinc-500">
            Entries JSON
            <textarea
              name="entries_json"
              required
              rows={7}
              className="admin-control w-full rounded-xl px-3 py-2 font-mono text-xs text-zinc-200 outline-none placeholder:text-zinc-500"
              defaultValue={`[\n  {\"user_id\":\"USR-1001\",\"account_id\":\"ACC-2001\",\"adjustment_type\":\"credit\",\"amount\":35,\"reason\":\"manual correction\"},\n  {\"account_id\":\"ACC-2002\",\"adjustment_type\":\"debit\",\"amount\":12.5}\n]`}
            />
          </label>

          <label className="block space-y-1.5 text-xs text-zinc-500">
            Reason
            <textarea
              name="reason"
              required
              rows={4}
              className="admin-control w-full rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
              placeholder="Explain why this batch adjustment should run."
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <AdminButton type="submit" variant="secondary" className="h-10 px-4" disabled={isBatchPending}>
              {isBatchPending ? "Running..." : "Run Batch Adjustments"}
            </AdminButton>
            <p className="text-xs text-zinc-500">Each row validates target and amount before posting.</p>
          </div>

          {batchState.error ? (
            <p className="break-words text-sm text-rose-300" aria-live="polite">
              {batchState.error}
            </p>
          ) : null}
          {batchState.success ? (
            <p className="break-words text-sm text-emerald-300" aria-live="polite">
              {batchState.success}
            </p>
          ) : null}
        </form>
      </section>
    </div>
  );
}

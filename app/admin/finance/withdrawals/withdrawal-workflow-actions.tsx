"use client";

import { useActionState, useMemo, useState } from "react";

import { AdminButton } from "@/components/system/actions/admin-button";
import type { WithdrawalRow } from "../_types";
import { transitionWithdrawalStatusAction } from "./actions";

type WithdrawalActionState = {
  error?: string;
  success?: string;
};

const INITIAL_STATE: WithdrawalActionState = {};

type TransitionOption = {
  value: WithdrawalRow["status"];
  label: string;
};

function isReasonRequired(status: WithdrawalRow["status"]) {
  return status === "rejected" || status === "failed" || status === "cancelled";
}

function getAllowedTransitions(status: WithdrawalRow["status"]): TransitionOption[] {
  if (status === "requested") {
    return [
      { value: "under_review", label: "Move to Under Review" },
      { value: "rejected", label: "Reject" },
      { value: "cancelled", label: "Cancel" },
    ];
  }

  if (status === "under_review") {
    return [
      { value: "approved", label: "Approve" },
      { value: "rejected", label: "Reject" },
      { value: "cancelled", label: "Cancel" },
    ];
  }

  if (status === "approved") {
    return [
      { value: "processing", label: "Mark Processing" },
      { value: "completed", label: "Mark Completed" },
      { value: "failed", label: "Mark Failed" },
      { value: "cancelled", label: "Cancel" },
    ];
  }

  if (status === "processing") {
    return [
      { value: "completed", label: "Mark Completed" },
      { value: "failed", label: "Mark Failed" },
    ];
  }

  return [];
}

export function WithdrawalWorkflowActions({
  withdrawalId,
  status,
  compact = false,
}: {
  withdrawalId: string;
  status: WithdrawalRow["status"];
  compact?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    transitionWithdrawalStatusAction,
    INITIAL_STATE
  );
  const [selectedNextStatus, setSelectedNextStatus] = useState<WithdrawalRow["status"] | "">("");
  const [reasonValue, setReasonValue] = useState("");
  const transitions = getAllowedTransitions(status);
  const hasTransitions = transitions.length > 0;
  const buttonClassName = compact ? "px-3 py-2" : "h-11 px-5";
  const effectiveNextStatus = selectedNextStatus || transitions[0]?.value || "";
  const reasonRequired = effectiveNextStatus ? isReasonRequired(effectiveNextStatus) : false;
  const canSubmit = hasTransitions && (!reasonRequired || reasonValue.trim().length > 0);
  const selectedLabel = useMemo(
    () => transitions.find((option) => option.value === effectiveNextStatus)?.label ?? "Select transition",
    [effectiveNextStatus, transitions]
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="withdrawal_id" value={withdrawalId} />

      <div className="space-y-1.5">
        <label
          htmlFor={`next_status_${withdrawalId}`}
          className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
        >
          Next Status
        </label>
        <select
          id={`next_status_${withdrawalId}`}
          name="next_status"
          value={effectiveNextStatus}
          onChange={(event) =>
            setSelectedNextStatus((event.target.value as WithdrawalRow["status"]) || "")
          }
          disabled={!hasTransitions || isPending}
          className="admin-control h-10 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {transitions.map((transition) => (
            <option key={transition.value} value={transition.value}>
              {transition.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
          <label
            htmlFor={`reason_${withdrawalId}`}
            className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
          >
            Reason {reasonRequired ? "(Required)" : "(Optional)"}
          </label>
          <input
            id={`reason_${withdrawalId}`}
            name="reason"
            placeholder="Reason for this status change"
            value={reasonValue}
            onChange={(event) => setReasonValue(event.target.value)}
            disabled={!hasTransitions || isPending}
            className="admin-control h-10 w-full rounded-xl px-3 text-sm text-zinc-200 outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`notes_${withdrawalId}`}
          className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
        >
          Review Notes
        </label>
        <textarea
          id={`notes_${withdrawalId}`}
          name="notes"
          rows={compact ? 2 : 3}
          placeholder="Optional operator notes"
          disabled={!hasTransitions || isPending}
          className="admin-control w-full rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <AdminButton
        type="submit"
        variant="primary"
        className={buttonClassName}
        disabled={!canSubmit || isPending}
      >
        {isPending ? "Applying..." : `Apply: ${selectedLabel}`}
      </AdminButton>

      {!hasTransitions ? (
        <p className="break-words text-xs text-zinc-500">
          This withdrawal is in a terminal state ({status}) and cannot transition further.
        </p>
      ) : null}
      {reasonRequired && reasonValue.trim().length === 0 ? (
        <p className="break-words text-xs text-amber-300">
          Reason is required for this transition to keep audit trace complete.
        </p>
      ) : null}

      {state.error ? (
        <p className="break-words text-xs text-rose-300" aria-live="polite">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="break-words text-xs text-emerald-300" aria-live="polite">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}

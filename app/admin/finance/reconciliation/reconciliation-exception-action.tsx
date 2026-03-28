"use client";

import { useActionState } from "react";

import { AdminButton } from "@/components/system/actions/admin-button";

import { queueReconciliationExceptionAction } from "./actions";

type ReconciliationActionState = {
  error?: string;
  success?: string;
};

const INITIAL_STATE: ReconciliationActionState = {};

export function ReconciliationExceptionAction({
  period,
  broker,
  status,
}: {
  period: string;
  broker: string;
  status: "matched" | "review" | "alert";
}) {
  const [state, formAction, isPending] = useActionState(
    queueReconciliationExceptionAction,
    INITIAL_STATE
  );

  if (status === "matched") {
    return <span className="text-xs text-zinc-500">No exception action</span>;
  }

  const buttonLabel = status === "alert" ? "Queue Alert Review" : "Queue Manual Review";

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="period" value={period} />
      <input type="hidden" name="broker" value={broker} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="note" value={`${broker} ${period} ${status}`} />
      <AdminButton
        type="submit"
        variant={status === "alert" ? "destructive" : "secondary"}
        className="h-9 px-3"
        disabled={isPending}
      >
        {isPending ? "Queueing..." : buttonLabel}
      </AdminButton>
      {state.error ? (
        <p className="max-w-[220px] break-words text-xs text-rose-300" aria-live="polite">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="max-w-[220px] break-words text-xs text-emerald-300" aria-live="polite">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}

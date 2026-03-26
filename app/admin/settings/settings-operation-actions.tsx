"use client";

import { useActionState } from "react";

import { AdminButton } from "@/components/system/actions/admin-button";

import { runSettingsOperationAction } from "./actions";
import type { SettingsOperationRecord } from "./_types";

type SettingsActionState = {
  error?: string;
  success?: string;
};

const INITIAL_STATE: SettingsActionState = {};

function SettingsOperationCard({ operation }: { operation: SettingsOperationRecord }) {
  const [state, formAction, isPending] = useActionState(runSettingsOperationAction, INITIAL_STATE);

  return (
    <div className="rounded-xl bg-white/[0.03] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{operation.title}</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Linked Module: {operation.linkedModule}
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">
          {operation.status}
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-400">{operation.description}</p>
      <div className="mt-3 rounded-xl bg-white/[0.03] px-3 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Next Step
        </p>
        <p className="mt-2 text-sm leading-6 text-zinc-300">{operation.nextStep}</p>
      </div>
      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="operation_key" value={operation.key} />
        <input type="hidden" name="operation_title" value={operation.title} />
        <input type="hidden" name="linked_module" value={operation.linkedModule} />
        <div className="flex flex-wrap items-center gap-3">
          <AdminButton type="submit" variant="primary" className="h-11 px-5" disabled={isPending}>
            {isPending ? "Running..." : "Run Guarded Action"}
          </AdminButton>
          <p className="break-words text-xs text-zinc-500">
            Guarded execution logs the operational intent before deeper backend wiring.
          </p>
        </div>
        {state.error ? <p className="break-words text-sm text-rose-300" aria-live="polite">{state.error}</p> : null}
        {state.success ? <p className="break-words text-sm text-emerald-300" aria-live="polite">{state.success}</p> : null}
      </form>
    </div>
  );
}

export function SettingsOperationActions({
  operations,
}: {
  operations: SettingsOperationRecord[];
}) {
  return (
    <div className="space-y-3">
      {operations.map((operation) => (
        <SettingsOperationCard key={operation.key} operation={operation} />
      ))}
    </div>
  );
}

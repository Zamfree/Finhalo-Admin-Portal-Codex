"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { AdminButton } from "@/components/system/actions/admin-button";
import { AdminSelect } from "@/components/system/controls/admin-select";
import type { SelectOption } from "@/types/system/option";

import { queueSupportHandoffAction } from "./actions";
import type { SupportRelatedModule } from "./_types";

type HandoffActionState = {
  error?: string;
  success?: string;
};

type HandoffModule =
  | "users"
  | "accounts"
  | "commission"
  | "finance"
  | "withdrawals"
  | "verification"
  | "technical";

const INITIAL_STATE: HandoffActionState = {};

const HANDOFF_OPTIONS: SelectOption<HandoffModule>[] = [
  { value: "users", label: "Users" },
  { value: "accounts", label: "Accounts" },
  { value: "commission", label: "Commission" },
  { value: "finance", label: "Finance" },
  { value: "withdrawals", label: "Withdrawals" },
  { value: "verification", label: "Verification" },
  { value: "technical", label: "Technical" },
];

function toInitialTargetModule(
  relatedModule: SupportRelatedModule,
  hasAccount: boolean,
  hasCommission: boolean,
  hasFinanceRecord: boolean
): HandoffModule {
  if (
    relatedModule === "accounts" ||
    relatedModule === "commission" ||
    relatedModule === "finance" ||
    relatedModule === "withdrawals" ||
    relatedModule === "verification" ||
    relatedModule === "technical"
  ) {
    return relatedModule;
  }

  if (hasFinanceRecord) {
    return "finance";
  }

  if (hasCommission) {
    return "commission";
  }

  if (hasAccount) {
    return "accounts";
  }

  return "users";
}

export function SupportHandoffQueueForm({
  ticketId,
  relatedModule,
  hasAccount,
  hasCommission,
  hasFinanceRecord,
}: {
  ticketId: string;
  relatedModule: SupportRelatedModule;
  hasAccount: boolean;
  hasCommission: boolean;
  hasFinanceRecord: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const initialTargetModule = useMemo(
    () => toInitialTargetModule(relatedModule, hasAccount, hasCommission, hasFinanceRecord),
    [hasAccount, hasCommission, hasFinanceRecord, relatedModule]
  );
  const [targetModule, setTargetModule] = useState<HandoffModule>(initialTargetModule);
  const [state, formAction, isPending] = useActionState(queueSupportHandoffAction, INITIAL_STATE);

  useEffect(() => {
    setTargetModule(initialTargetModule);
  }, [initialTargetModule]);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="ticket_id" value={ticketId} />
      <input type="hidden" name="target_module" value={targetModule} />

      <div className="space-y-2">
        <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Target Module
        </label>
        <AdminSelect
          value={targetModule}
          onValueChange={setTargetModule}
          options={HANDOFF_OPTIONS}
          placeholder="Select module"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`handoff-note-${ticketId}`}
          className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
        >
          Handoff Note (Optional)
        </label>
        <textarea
          id={`handoff-note-${ticketId}`}
          name="handoff_note"
          rows={3}
          maxLength={1200}
          disabled={isPending}
          placeholder="Queue context for the next operator handoff."
          className="admin-control min-h-[96px] w-full resize-y rounded-2xl px-4 py-3 text-sm text-zinc-200 outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <AdminButton type="submit" variant="secondary" className="h-11 px-5" disabled={isPending}>
          {isPending ? "Queueing..." : "Queue Handoff Action"}
        </AdminButton>
        <p className="break-words text-xs text-zinc-500">
          Writes a system timeline note and queues a guarded support handoff operation.
        </p>
      </div>

      {state.error ? (
        <p className="break-words text-sm text-rose-300" aria-live="polite">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="break-words text-sm text-emerald-300" aria-live="polite">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}

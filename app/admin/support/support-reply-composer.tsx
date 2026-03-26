"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { AdminButton } from "@/components/system/actions/admin-button";
import { AdminSelect } from "@/components/system/controls/admin-select";
import type { SelectOption } from "@/types/system/option";

import { replyTicketAction } from "./actions";
import type { SupportReplyActionStatus } from "./_types";

type ReplyActionState = {
  error?: string;
  success?: string;
};

const INITIAL_STATE: ReplyActionState = {};

const REPLY_STATUS_OPTIONS: SelectOption<SupportReplyActionStatus>[] = [
  { value: "open", label: "Open Intake" },
  { value: "pending", label: "Pending User Reply" },
  { value: "closed", label: "Closed" },
];

export function SupportReplyComposer({
  ticketId,
  currentModeLabel,
  suggestedStatus,
  suggestedStatusLabel,
  actionNote,
  serverActionReady,
}: {
  ticketId: string;
  currentModeLabel: string;
  suggestedStatus: SupportReplyActionStatus;
  suggestedStatusLabel: string;
  actionNote: string;
  serverActionReady: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [nextStatus, setNextStatus] = useState<SupportReplyActionStatus>(suggestedStatus);
  const [state, formAction, isPending] = useActionState(replyTicketAction, INITIAL_STATE);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setNextStatus(suggestedStatus);
    }
  }, [state.success, suggestedStatus]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white/[0.03] px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Action Alignment
        </p>
        <p className="mt-2 text-sm text-zinc-300">
          {currentModeLabel} {"->"} {suggestedStatusLabel}
        </p>
        <p className="mt-2 break-words text-xs leading-6 text-zinc-500">{actionNote}</p>
      </div>

      <form ref={formRef} action={formAction} className="space-y-4">
        <input type="hidden" name="ticket_id" value={ticketId} />
        <input type="hidden" name="next_status" value={nextStatus} />

        <div className="space-y-2">
          <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Next Reply Status
          </label>
          <AdminSelect
            value={nextStatus}
            onValueChange={setNextStatus}
            options={REPLY_STATUS_OPTIONS}
            placeholder="Select next status"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor={`reply-message-${ticketId}`}
            className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
          >
            Reply Message
          </label>
          <textarea
            id={`reply-message-${ticketId}`}
            name="reply_message"
            rows={5}
            maxLength={4000}
            minLength={3}
            required
            disabled={!serverActionReady || isPending}
            placeholder="Write the operational reply that should be sent to the requester."
            className="admin-control min-h-[132px] w-full resize-y rounded-2xl px-4 py-3 text-sm text-zinc-200 outline-none"
          />
          <p className="text-xs text-zinc-500">Up to 4000 characters. Keep replies specific and operator-ready.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AdminButton
            type="submit"
            variant="primary"
            className="h-11 px-5"
            disabled={!serverActionReady || isPending}
          >
            {isPending ? "Sending Reply..." : "Send Reply"}
          </AdminButton>
          <p className="break-words text-xs text-zinc-500">
            {serverActionReady
              ? "This sends an admin reply and updates the ticket status through the existing server action."
              : "Reply is disabled while this case remains closed."}
          </p>
        </div>

        {state.error ? <p className="break-words text-sm text-rose-300" aria-live="polite">{state.error}</p> : null}
        {state.success ? <p className="break-words text-sm text-emerald-300" aria-live="polite">{state.success}</p> : null}
      </form>
    </div>
  );
}

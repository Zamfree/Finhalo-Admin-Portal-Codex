"use client";

import { useActionState } from "react";

import { replyTicketAction } from "@/app/admin/support/actions";

type ReplyFormProps = {
  ticketId: string;
  currentStatus: "open" | "pending" | "closed";
};

type ReplyState = {
  error?: string;
  success?: string;
};

const INITIAL_STATE: ReplyState = {};

export function ReplyForm({ ticketId, currentStatus }: ReplyFormProps) {
  const [state, formAction, isPending] = useActionState(replyTicketAction, INITIAL_STATE);

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-md">
      <h2 className="mb-4 text-base font-semibold text-white">Reply Ticket</h2>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="ticket_id" value={ticketId} />

        <div>
          <label
            htmlFor="reply_message"
            className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
          >
            Reply message
          </label>
          <textarea
            id="reply_message"
            name="reply_message"
            rows={5}
            placeholder="Type your response to the user..."
            className="admin-control w-full rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
          />
        </div>

        <div>
          <label
            htmlFor="next_status"
            className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
          >
            Ticket status
          </label>
          <select
            id="next_status"
            name="next_status"
            defaultValue={currentStatus === "closed" ? "closed" : "pending"}
            className="admin-control w-full rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none"
          >
            <option value="open">open</option>
            <option value="pending">pending</option>
            <option value="closed">closed</option>
          </select>
        </div>

        {state.error ? <p className="text-sm text-rose-300">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-emerald-300">{state.success}</p> : null}

        <button
          type="submit"
          disabled={isPending}
          className="admin-interactive rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Sending..." : "Send Reply"}
        </button>
      </form>
    </section>
  );
}

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
    <section className="rounded-lg border bg-background p-4 shadow-sm">
      <h2 className="mb-4 text-base font-semibold">Reply Ticket</h2>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="ticket_id" value={ticketId} />

        <div>
          <label htmlFor="reply_message" className="mb-1 block text-sm font-medium">
            Reply message
          </label>
          <textarea
            id="reply_message"
            name="reply_message"
            rows={5}
            placeholder="Type your response to the user..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="next_status" className="mb-1 block text-sm font-medium">
            Ticket status
          </label>
          <select
            id="next_status"
            name="next_status"
            defaultValue={currentStatus === "closed" ? "closed" : "pending"}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="open">open</option>
            <option value="pending">pending</option>
            <option value="closed">closed</option>
          </select>
        </div>

        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-green-600">{state.success}</p> : null}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Sending..." : "Send Reply"}
        </button>
      </form>
    </section>
  );
}

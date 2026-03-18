"use client";

import { useActionState } from "react";

import { replyTicketAction } from "@/app/admin/support/actions";

type ReplyState = {
  error?: string;
  success?: string;
};

const INITIAL_STATE: ReplyState = {};

type ReplyFormProps = {
  ticketId: string;
  currentStatus: string;
};

export function ReplyForm({ ticketId, currentStatus }: ReplyFormProps) {
  const [state, formAction, isPending] = useActionState(replyTicketAction, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="ticket_id" value={ticketId} />

      <div>
        <label htmlFor="reply" className="mb-1 block text-sm font-medium">
          Reply
        </label>
        <textarea
          id="reply"
          name="reply"
          rows={4}
          placeholder="Type your reply to the user"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="status" className="mb-1 block text-sm font-medium">
          Ticket status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={currentStatus}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="open">open</option>
          <option value="pending">pending</option>
          <option value="closed">closed</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Sending..." : "Send reply"}
      </button>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-600">{state.success}</p> : null}
    </form>
  );
}

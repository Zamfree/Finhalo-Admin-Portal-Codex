"use client";

import { useActionState, useEffect, useRef } from "react";

import { AdminButton } from "@/components/system/actions/admin-button";

import { addInternalNoteAction } from "./actions";

type NoteActionState = {
  error?: string;
  success?: string;
};

const INITIAL_STATE: NoteActionState = {};

export function SupportNoteComposer({ ticketId }: { ticketId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(addInternalNoteAction, INITIAL_STATE);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="ticket_id" value={ticketId} />

      <div className="space-y-2">
        <label
          htmlFor={`internal-note-${ticketId}`}
          className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
        >
          Internal Note
        </label>
        <textarea
          id={`internal-note-${ticketId}`}
          name="internal_note"
          rows={4}
          maxLength={2000}
          minLength={3}
          required
          disabled={isPending}
          placeholder="Write an internal investigation note for admin use only."
          className="admin-control min-h-[116px] w-full resize-y rounded-2xl px-4 py-3 text-sm text-zinc-200 outline-none"
        />
        <p className="text-xs text-zinc-500">Up to 2000 characters. Internal notes stay inside the admin investigation trail.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <AdminButton type="submit" variant="secondary" className="h-11 px-5" disabled={isPending}>
          {isPending ? "Saving Note..." : "Save Internal Note"}
        </AdminButton>
      </div>

      {state.error ? <p className="break-words text-sm text-rose-300" aria-live="polite">{state.error}</p> : null}
      {state.success ? <p className="break-words text-sm text-emerald-300" aria-live="polite">{state.success}</p> : null}
    </form>
  );
}

import { DataPanel } from "@/components/system/data/data-panel";
import type { SupportTicket, SupportTicketTimelineItem } from "../_types";

export function TicketTimelineTab({
  ticket,
  timeline,
}: {
  ticket: SupportTicket;
  timeline: SupportTicketTimelineItem[];
}) {
  return (
    <DataPanel
      title={
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Investigation Trail
        </h3>
      }
      description={
        <p className="break-words text-sm text-zinc-400">
          Review the latest case movement first. This area is reserved for conversation history,
          internal notes, and future admin action tracking. Last updated{" "}
          {new Date(ticket.updated_at).toLocaleString()}.
        </p>
      }
    >
      <div className="space-y-3">
        {timeline.length === 0 ? (
          <div className="admin-surface-soft rounded-xl p-6 text-sm text-zinc-500" role="status" aria-live="polite">
            No case activity is available yet. This panel is ready for future timeline and internal
            note data.
          </div>
        ) : (
          timeline.map((message) => (
            <article
              key={message.message_id}
              className={`admin-surface-soft space-y-3 rounded-xl p-4 text-sm ${
                message.author_type === "admin"
                  ? "bg-white/[0.05]"
                  : message.author_type === "system"
                    ? "bg-white/[0.03]"
                    : ""
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {message.author_type}
                  </p>
                  {message.is_internal ? (
                    <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-amber-300">
                      Internal
                    </span>
                  ) : null}
                </div>
                <p className="min-w-0 break-words text-right text-xs text-zinc-500">
                  {message.author_name} · {new Date(message.created_at).toLocaleString()}
                </p>
              </div>
              <p className="break-words whitespace-pre-wrap text-zinc-200">{message.body}</p>
            </article>
          ))
        )}
      </div>
    </DataPanel>
  );
}

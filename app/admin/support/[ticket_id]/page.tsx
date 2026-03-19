import { notFound } from "next/navigation";

import { ReplyForm } from "@/components/support/reply-form";
import { supabaseServer } from "@/lib/supabase/server";

type TicketDetailProps = {
  params: Promise<{
    ticket_id: string;
  }>;
};

type TicketRow = {
  id: string;
  user_id: string;
  subject: string;
  status: "open" | "pending" | "closed";
  created_at: string;
};

type TicketMessageRow = {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
};

export default async function SupportTicketDetailPage({ params }: TicketDetailProps) {
  const { ticket_id } = await params;

  const [{ data: ticketData, error: ticketError }, { data: messagesData, error: messagesError }] =
    await Promise.all([
      supabaseServer
        .from("support_tickets")
        .select("id,user_id,subject,status,created_at")
        .eq("id", ticket_id)
        .single(),
      supabaseServer
        .from("support_ticket_messages")
        .select("id,sender_type,message,created_at")
        .eq("ticket_id", ticket_id)
        .order("created_at", { ascending: true })
        .limit(500),
    ]);

  if (ticketError) {
    if (ticketError.code === "PGRST116") {
      notFound();
    }

    throw new Error(ticketError.message);
  }

  if (messagesError) {
    throw new Error(messagesError.message);
  }

  const ticket = ticketData as TicketRow;
  const messages = (messagesData as TicketMessageRow[] | null) ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Ticket Detail</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Ticket ID</dt>
            <dd>{ticket.id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">User ID</dt>
            <dd>{ticket.user_id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Subject</dt>
            <dd>{ticket.subject}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd>{ticket.status}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Created At</dt>
            <dd>{new Date(ticket.created_at).toLocaleString()}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Conversation</h2>
        <div className="space-y-3">
          {messages.map((message) => (
            <article key={message.id} className="rounded-md border p-3 text-sm">
              <p className="text-xs text-muted-foreground">
                {message.sender_type} · {new Date(message.created_at).toLocaleString()}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{message.message}</p>
            </article>
          ))}
          {messages.length === 0 ? <p className="text-sm text-muted-foreground">No conversation yet.</p> : null}
        </div>
      </section>

      <ReplyForm ticketId={ticket.id} currentStatus={ticket.status} />
    </div>
  );
}

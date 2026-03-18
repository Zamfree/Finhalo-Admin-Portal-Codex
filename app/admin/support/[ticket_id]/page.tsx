import { notFound } from "next/navigation";

import { ReplyForm } from "@/components/support/reply-form";
import { supabaseServer } from "@/lib/supabase/server";

type TicketDetail = {
  id: string;
  user_id: string;
  subject: string;
  status: "open" | "pending" | "closed";
  created_at: string;
};

type TicketMessage = {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
};

type TicketDetailPageProps = {
  params: Promise<{
    ticket_id: string;
  }>;
};

async function getTicket(ticketId: string) {
  const { data, error } = await supabaseServer
    .from("support_tickets")
    .select("id,user_id,subject,status,created_at")
    .eq("id", ticketId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as TicketDetail | null;
}

async function getTicketMessages(ticketId: string) {
  const { data, error } = await supabaseServer
    .from("support_ticket_messages")
    .select("id,sender_type,message,created_at")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as TicketMessage[] | null) ?? [];
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { ticket_id: ticketId } = await params;

  const [ticket, messages] = await Promise.all([getTicket(ticketId), getTicketMessages(ticketId)]);

  if (!ticket) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h1 className="text-lg font-semibold">Ticket {ticket.id}</h1>
        <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
          <p>
            <span className="font-medium">User:</span> {ticket.user_id}
          </p>
          <p>
            <span className="font-medium">Status:</span> {ticket.status}
          </p>
          <p className="md:col-span-2">
            <span className="font-medium">Subject:</span> {ticket.subject}
          </p>
          <p>
            <span className="font-medium">Created:</span> {new Date(ticket.created_at).toLocaleString()}
          </p>
        </div>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold">Conversation</h2>
        <div className="space-y-3">
          {messages.map((message) => (
            <article key={message.id} className="rounded-md border p-3 text-sm">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="font-medium capitalize">{message.sender_type}</p>
                <p className="text-xs text-muted-foreground">{new Date(message.created_at).toLocaleString()}</p>
              </div>
              <p className="whitespace-pre-wrap">{message.message}</p>
            </article>
          ))}

          {messages.length === 0 ? <p className="text-sm text-muted-foreground">No messages yet.</p> : null}
        </div>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold">Reply Ticket</h2>
        <ReplyForm ticketId={ticket.id} currentStatus={ticket.status} />
      </section>
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";

import { ReplyForm } from "@/components/support/reply-form";
import { createClient } from "@/lib/supabase/server";

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
  profiles: {
    full_name: string | null;
  } | null;
};

type TicketMessageRow = {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
};

export default async function SupportTicketDetailPage({ params }: TicketDetailProps) {
  const { ticket_id } = await params;
  const supabase = await createClient();

  const [{ data: ticketData, error: ticketError }, { data: messagesData, error: messagesError }] =
    await Promise.all([
      supabase
        .from("support_tickets")
        .select(`
          id,
          user_id,
          subject,
          status,
          created_at,
          profiles (
            full_name
          )
        `)
        .eq("id", ticket_id)
        .maybeSingle(),
      supabase
        .from("support_ticket_messages")
        .select("id,sender_type,message,created_at")
        .eq("ticket_id", ticket_id)
        .order("created_at", { ascending: true })
        .limit(500),
    ]);

  if (ticketError) {
    console.error("Error fetching ticket detail:", ticketError);
    throw new Error(ticketError.message);
  }

  if (!ticketData) {
    notFound();
  }

  if (messagesError) {
    console.error("Error fetching ticket messages:", messagesError);
  }

  const ticket = ticketData as unknown as TicketRow;
  const messages = (messagesData as TicketMessageRow[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/support"
          className="text-sm text-muted-foreground hover:text-primary hover:underline flex items-center gap-1"
        >
          ← Back to Support Tickets
        </Link>
      </div>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold border-b pb-2">Ticket Detail</h2>
        <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="text-muted-foreground font-medium">Subject</dt>
            <dd className="text-lg font-semibold">{ticket.subject || "No Subject"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">Status</dt>
            <dd>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                  ticket.status === "open"
                    ? "bg-blue-100 text-blue-700"
                    : ticket.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                }`}
              >
                {ticket.status}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">User</dt>
            <dd>
              <Link
                href={`/admin/users/${ticket.user_id}`}
                className="group inline-block"
              >
                <div className="font-medium group-hover:text-primary group-hover:underline">
                  {ticket.profiles?.full_name ?? "Unknown User"}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {ticket.user_id}
                </div>
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">Ticket ID</dt>
            <dd className="font-mono text-xs text-muted-foreground">{ticket.id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground font-medium">Created At</dt>
            <dd className="text-muted-foreground">{new Date(ticket.created_at).toLocaleString()}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold border-b pb-2">Conversation</h2>
        <div className="space-y-4">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`rounded-lg border p-4 text-sm shadow-sm ${
                message.sender_type === "admin"
                  ? "bg-muted/30 border-primary/20 ml-8"
                  : "bg-background mr-8"
              }`}
            >
              <header className="flex items-center justify-between mb-2">
                <span className={`font-semibold ${message.sender_type === "admin" ? "text-primary" : "text-foreground"}`}>
                  {message.sender_type === "admin" ? "Administrator" : "Customer"}
                </span>
                <time className="text-[10px] text-muted-foreground italic">
                  {new Date(message.created_at).toLocaleString()}
                </time>
              </header>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">{message.message || "No message content."}</p>
            </article>
          ))}
          {messages.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground italic">
              No conversation history found.
            </div>
          ) : null}
        </div>
      </section>

      <div className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold border-b pb-2">Post a Reply</h2>
        <ReplyForm ticketId={ticket.id} currentStatus={ticket.status} />
      </div>
    </div>
  );
}

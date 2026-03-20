import { ReplyForm } from "@/components/support/reply-form";

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

  const ticket: TicketRow = {
    id: ticket_id,
    user_id: "USR-1001",
    subject: "Withdrawal pending review",
    status: "open",
    created_at: "2026-03-19T10:50:00Z",
  };

  const messages: TicketMessageRow[] = [
    {
      id: "MSG-8101",
      sender_type: "user",
      message: "I requested a withdrawal yesterday but it still shows pending.",
      created_at: "2026-03-19T10:52:00Z",
    },
    {
      id: "MSG-8102",
      sender_type: "admin",
      message: "Thanks for reporting this. We are reviewing the request in the withdrawals queue.",
      created_at: "2026-03-19T11:15:00Z",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h1 className="text-base font-semibold">Ticket Detail</h1>
        <p className="mb-4 text-sm text-muted-foreground">Static ticket context for support workflow and UI shell preview.</p>
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
        </div>
      </section>

      <ReplyForm ticketId={ticket.id} currentStatus={ticket.status} />
    </div>
  );
}

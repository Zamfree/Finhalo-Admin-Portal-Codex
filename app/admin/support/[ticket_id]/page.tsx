import { ReplyForm } from "@/components/support/reply-form";
import { DataPanel } from "@/components/system/data/data-panel";

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
    <div className="space-y-6 pb-8">
      <section>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Support
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          Ticket Detail
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          Static ticket context for support workflow and UI shell preview.
        </p>
      </section>

      <DataPanel title={<h2 className="text-xl font-semibold text-white">Ticket Overview</h2>}>
        <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Ticket ID
            </dt>
            <dd className="mt-2 font-mono text-zinc-200">{ticket.id}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              User ID
            </dt>
            <dd className="mt-2 font-mono text-zinc-200">{ticket.user_id}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Subject
            </dt>
            <dd className="mt-2 text-zinc-200">{ticket.subject}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Status
            </dt>
            <dd className="mt-2 text-zinc-200">{ticket.status}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Created At
            </dt>
            <dd className="mt-2 text-zinc-200">
              {new Date(ticket.created_at).toLocaleString()}
            </dd>
          </div>
        </dl>
      </DataPanel>

      <DataPanel title={<h2 className="text-xl font-semibold text-white">Conversation</h2>}>
        <div className="space-y-3">
          {messages.map((message) => (
            <article
              key={message.id}
              className="admin-surface-soft p-4 text-sm"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {message.sender_type} - {new Date(message.created_at).toLocaleString()}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-zinc-200">{message.message}</p>
            </article>
          ))}
        </div>
      </DataPanel>

      <ReplyForm ticketId={ticket.id} currentStatus={ticket.status} />
    </div>
  );
}

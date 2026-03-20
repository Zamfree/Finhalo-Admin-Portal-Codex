import Link from "next/link";

type TicketRow = {
  id: string;
  user_id: string;
  subject: string;
  status: "open" | "pending" | "closed";
  created_at: string;
};

const MOCK_TICKETS: TicketRow[] = [
  { id: "TCK-4101", user_id: "USR-1001", subject: "Withdrawal pending review", status: "open", created_at: "2026-03-19T10:50:00Z" },
  { id: "TCK-4102", user_id: "USR-1002", subject: "Commission mismatch follow-up", status: "pending", created_at: "2026-03-19T08:35:00Z" },
  { id: "TCK-4103", user_id: "USR-1004", subject: "Update account verification", status: "closed", created_at: "2026-03-18T16:10:00Z" },
];

export default async function SupportPage() {
  const tickets = MOCK_TICKETS;

  return (
    <section className="rounded-lg border bg-background p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Support Tickets</h1>
          <p className="text-sm text-muted-foreground">Static support queue for preview and detail-page workflow checks.</p>
        </div>
        <button type="button" className="rounded-md border px-3 py-2 text-xs text-muted-foreground" disabled>
          New ticket (Preview)
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Ticket ID</th>
              <th className="py-2 pr-4 font-medium">User ID</th>
              <th className="py-2 pr-4 font-medium">Subject</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium">Created At</th>
              <th className="py-2 pr-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b last:border-0">
                <td className="py-2 pr-4">{ticket.id}</td>
                <td className="py-2 pr-4">{ticket.user_id}</td>
                <td className="py-2 pr-4">{ticket.subject}</td>
                <td className="py-2 pr-4">{ticket.status}</td>
                <td className="py-2 pr-4">{new Date(ticket.created_at).toLocaleString()}</td>
                <td className="py-2 pr-4">
                  <Link href={`/admin/support/${ticket.id}`} className="rounded-md border px-2 py-1 text-xs hover:bg-muted">
                    Open detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type TicketDetailPageProps = {
  params: Promise<{
    ticket_id: string;
  }>;
};

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { ticket_id } = await params;

  const ticketDetail = {
    id: ticket_id,
    subject: "Unable to bind trading account",
    status: "Open",
    priority: "High",
    user: "client@example.com",
    created_at: "2026-03-20 10:30",
    description:
      "Client reported that the broker account binding flow failed after submitting account details.",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Support Ticket</h1>
        <p className="text-sm text-muted-foreground">
          Review ticket details and response history.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Ticket ID</p>
            <p className="text-sm font-medium">{ticketDetail.id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="text-sm font-medium">{ticketDetail.status}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Priority</p>
            <p className="text-sm font-medium">{ticketDetail.priority}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">User</p>
            <p className="text-sm font-medium">{ticketDetail.user}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Subject</p>
          <p className="text-sm font-medium">{ticketDetail.subject}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Description</p>
          <p className="text-sm">{ticketDetail.description}</p>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";

import { DataPanel } from "@/components/system/data/data-panel";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";

type TicketRow = {
  id: string;
  user_id: string;
  subject: string;
  status: "open" | "pending" | "closed";
  created_at: string;
};

const MOCK_TICKETS: TicketRow[] = [
  {
    id: "TCK-4101",
    user_id: "USR-1001",
    subject: "Withdrawal pending review",
    status: "open",
    created_at: "2026-03-19T10:50:00Z",
  },
  {
    id: "TCK-4102",
    user_id: "USR-1002",
    subject: "Commission mismatch follow-up",
    status: "pending",
    created_at: "2026-03-19T08:35:00Z",
  },
  {
    id: "TCK-4103",
    user_id: "USR-1004",
    subject: "Update account verification",
    status: "closed",
    created_at: "2026-03-18T16:10:00Z",
  },
];

function getStatusClass(status: TicketRow["status"]) {
  if (status === "open") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }

  if (status === "pending") {
    return "border-blue-500/20 bg-blue-500/10 text-blue-300";
  }

  return "border-zinc-500/20 bg-zinc-500/10 text-zinc-300";
}

const ticketColumns: DataTableColumn<TicketRow>[] = [
  {
    key: "id",
    header: "Ticket ID",
    cell: (ticket) => ticket.id,
    cellClassName: "py-3 pr-6 font-mono text-sm text-zinc-400",
  },
  {
    key: "user_id",
    header: "User ID",
    cell: (ticket) => ticket.user_id,
    cellClassName: "py-3 pr-6 font-mono text-sm text-zinc-300",
  },
  {
    key: "subject",
    header: "Subject",
    cell: (ticket) => <span className="text-white">{ticket.subject}</span>,
  },
  {
    key: "status",
    header: "Status",
    cell: (ticket) => (
      <span
        className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${getStatusClass(
          ticket.status
        )}`}
      >
        {ticket.status}
      </span>
    ),
  },
  {
    key: "created_at",
    header: "Created At",
    cell: (ticket) => new Date(ticket.created_at).toLocaleString(),
    cellClassName: "py-3 pr-6 text-sm text-zinc-400",
  },
  {
    key: "action",
    header: "Action",
    cell: (ticket) => (
      <Link
        href={`/admin/support/${ticket.id}`}
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-300 transition hover:bg-white/10 hover:text-white"
      >
        View detail
      </Link>
    ),
    headerClassName:
      "py-2.5 pr-0 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-0 text-right align-middle",
  },
];

export default async function SupportPage() {
  const tickets = MOCK_TICKETS;

  return (
    <div className="space-y-6 pb-8">
      <DataPanel
        title={
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Support
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Tickets
            </h1>
          </div>
        }
        description={
          <p className="text-sm text-zinc-400">
            Static support queue for preview and detail-page workflow checks.
          </p>
        }
        actions={
          <button
            type="button"
            className="h-11 rounded-xl border border-white/10 bg-white/5 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-300 transition hover:bg-white/10 hover:text-white"
            disabled
          >
            New ticket
          </button>
        }
      >
        <DataTable
          columns={ticketColumns}
          rows={tickets}
          getRowKey={(ticket) => ticket.id}
          minWidthClassName="min-w-[900px]"
        />
      </DataPanel>
    </div>
  );
}

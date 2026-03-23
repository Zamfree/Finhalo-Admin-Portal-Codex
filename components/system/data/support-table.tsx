"use client";

import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";

type TicketRow = {
  id: string;
  user_id: string;
  subject: string;
  status: "open" | "pending" | "closed";
  created_at: string;
};

type SupportTableProps = {
  rows: TicketRow[];
  onRowClick?: (row: TicketRow) => void;
};

function getStatusClass(status: TicketRow["status"]) {
  if (status === "open") {
    return "bg-amber-500/10 text-amber-300";
  }

  if (status === "pending") {
    return "bg-blue-500/10 text-blue-300";
  }

  return "bg-zinc-500/10 text-zinc-300";
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
        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${getStatusClass(
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
];

export function SupportTable({ rows, onRowClick }: SupportTableProps) {
  return (
    <DataTable
      columns={ticketColumns}
      rows={rows}
      getRowKey={(row) => row.id}
      minWidthClassName="min-w-[900px]"
      onRowClick={onRowClick}
    />
  );
}

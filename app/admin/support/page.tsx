import Link from "next/link";

import { supabaseServer } from "@/lib/supabase/server";

type TicketRow = {
  id: string;
  user_id: string;
  subject: string;
  status: "open" | "pending" | "closed";
  created_at: string;
};

async function getTickets() {
  const { data, error } = await supabaseServer
    .from("support_tickets")
    .select("id,user_id,subject,status,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return (data as TicketRow[] | null) ?? [];
}

export default async function SupportPage() {
  const tickets = await getTickets();

  return (
    <section className="rounded-lg border bg-background p-4 shadow-sm">
      <h2 className="mb-4 text-base font-semibold">Support Tickets</h2>

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
                  <Link
                    href={`/admin/support/${ticket.id}`}
                    className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                  >
                    Open detail
                  </Link>
                </td>
              </tr>
            ))}
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-muted-foreground">
                  No support tickets found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

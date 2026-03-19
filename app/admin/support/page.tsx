import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

type TicketRow = {
  id: string;
  user_id: string;
  subject: string;
  status: "open" | "pending" | "closed";
  created_at: string;
  updated_at: string | null;
  profiles: {
    full_name: string | null;
  } | null;
};

async function getTickets() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_tickets")
    .select(`
      id,
      user_id,
      subject,
      status,
      created_at,
      updated_at,
      profiles (
        full_name
      )
    `)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Error fetching support tickets:", error);
    return [];
  }

  return (data as unknown as TicketRow[] | null) ?? [];
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
              <th className="py-2 pr-4 font-medium text-left">Ticket</th>
              <th className="py-2 pr-4 font-medium text-left">User</th>
              <th className="py-2 pr-4 font-medium text-left">Status</th>
              <th className="py-2 pr-4 font-medium text-left">Created At</th>
              <th className="py-2 pr-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="py-3 pr-4 align-top">
                  <div className="font-medium text-foreground">{ticket.subject || "No Subject"}</div>
                  <div className="text-xs text-muted-foreground font-mono">{ticket.id}</div>
                </td>
                <td className="py-3 pr-4 align-top">
                  <div className="font-medium text-foreground">{ticket.profiles?.full_name ?? "Unknown"}</div>
                  <div className="text-xs text-muted-foreground font-mono">{ticket.user_id}</div>
                </td>
                <td className="py-3 pr-4 align-top">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      ticket.status === "open"
                        ? "bg-blue-100 text-blue-700"
                        : ticket.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {ticket.status}
                  </span>
                </td>
                <td className="py-3 pr-4 align-top text-muted-foreground">
                  <div className="whitespace-nowrap">{new Date(ticket.created_at).toLocaleString()}</div>
                  {ticket.updated_at && (
                    <div className="text-[10px] text-muted-foreground italic">
                      Updated: {new Date(ticket.updated_at).toLocaleString()}
                    </div>
                  )}
                </td>
                <td className="py-3 pr-4 align-top text-right">
                  <Link
                    href={`/admin/support/${ticket.id}`}
                    className="inline-flex items-center rounded-md border bg-background px-2.5 py-1 text-xs font-medium shadow-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-muted-foreground">
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

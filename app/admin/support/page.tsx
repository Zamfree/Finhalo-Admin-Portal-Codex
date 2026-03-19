import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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
      profiles (
        full_name
      )
    `)
    .order("created_at", { ascending: false })
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
              <th className="py-2 pr-4 font-medium">Ticket ID</th>
              <th className="py-2 pr-4 font-medium">User</th>
              <th className="py-2 pr-4 font-medium">Subject</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium">Created At</th>
              <th className="py-2 pr-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                <td className="py-3 pr-4 font-mono text-xs">{ticket.id}</td>
                <td className="py-3 pr-4">
                  <Link
                    href={`/admin/users/${ticket.user_id}`}
                    className="group block"
                  >
                    <div className="font-medium group-hover:text-primary group-hover:underline">
                      {ticket.profiles?.full_name ?? "Unknown User"}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {ticket.user_id}
                    </div>
                  </Link>
                </td>
                <td className="py-3 pr-4 font-medium">{ticket.subject || "No Subject"}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
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
                <td className="py-3 pr-4 text-muted-foreground">
                  {new Date(ticket.created_at).toLocaleString()}
                </td>
                <td className="py-3 pr-4">
                  <Link
                    href={`/admin/support/${ticket.id}`}
                    className="inline-flex items-center rounded-md border bg-background px-2.5 py-1 text-xs font-medium shadow-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    Open detail
                  </Link>
                </td>
              </tr>
            ))}
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground italic">
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

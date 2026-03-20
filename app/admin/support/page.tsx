import Link from "next/link";

import { supabaseServer } from "@/lib/supabase/server";

type SearchParams = {
  q?: string;
  user_id?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
};

type TicketRow = {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
};

type SupportPageProps = {
  searchParams: Promise<SearchParams>;
};

function asNonEmptyString(value: unknown, fallback = "-"): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString();
}

function normalizeStatus(value: unknown): string {
  const status = asNonEmptyString(value).toLowerCase();
  return status === "open" || status === "pending" || status === "closed" ? status : "unknown";
}

function normalizeTicketRow(row: Record<string, unknown>): TicketRow | null {
  const id = asNonEmptyString(row.id, "");

  if (!id) {
    return null;
  }

  return {
    id,
    user_id: asNonEmptyString(row.user_id),
    subject: asNonEmptyString(row.subject),
    status: normalizeStatus(row.status),
    created_at: asNonEmptyString(row.created_at, ""),
  };
}

function buildSupportHref(filters: SearchParams): string {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.user_id) params.set("user_id", filters.user_id);
  if (filters.status) params.set("status", filters.status);
  if (filters.from_date) params.set("from_date", filters.from_date);
  if (filters.to_date) params.set("to_date", filters.to_date);

  const query = params.toString();
  return query ? `/admin/support?${query}` : "/admin/support";
}

function buildTicketDetailHref(ticketId: string, filters: SearchParams): string {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.user_id) params.set("user_id", filters.user_id);
  if (filters.status) params.set("status", filters.status);
  if (filters.from_date) params.set("from_date", filters.from_date);
  if (filters.to_date) params.set("to_date", filters.to_date);

  const query = params.toString();
  return query ? `/admin/support/${ticketId}?${query}` : `/admin/support/${ticketId}`;
}

async function getTickets(filters: SearchParams) {
  let query = supabaseServer
    .from("support_tickets")
    .select("id,user_id,subject,status,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.user_id) {
    query = query.eq("user_id", filters.user_id);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.from_date) {
    query = query.gte("created_at", `${filters.from_date}T00:00:00`);
  }

  if (filters.to_date) {
    query = query.lte("created_at", `${filters.to_date}T23:59:59`);
  }

  if (filters.q) {
    query = query.or(`id.ilike.%${filters.q}%,subject.ilike.%${filters.q}%,user_id.ilike.%${filters.q}%`);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return (data as Record<string, unknown>[])
    .map((row) => normalizeTicketRow(row))
    .filter((row): row is TicketRow => row !== null);
}

export default async function SupportPage({ searchParams }: SupportPageProps) {
  const params = await searchParams;

  const q = params.q?.trim() ?? "";
  const userId = params.user_id?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const fromDate = params.from_date?.trim() ?? "";
  const toDate = params.to_date?.trim() ?? "";

  const filters: SearchParams = {
    q: q || undefined,
    user_id: userId || undefined,
    status: status || undefined,
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
  };

  const tickets = await getTickets(filters);

  return (
    <section className="rounded-lg border bg-background p-4 shadow-sm">
      <h2 className="mb-4 text-base font-semibold">Support Tickets</h2>

      <form className="mb-4 grid gap-3 md:grid-cols-5 md:items-end">
        <div>
          <label htmlFor="q" className="mb-1 block text-sm font-medium">
            Search
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Ticket ID, user, subject"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="user_id" className="mb-1 block text-sm font-medium">
            User ID
          </label>
          <input
            id="user_id"
            name="user_id"
            defaultValue={userId}
            placeholder="user_id"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div>
          <label htmlFor="from_date" className="mb-1 block text-sm font-medium">
            From date
          </label>
          <input
            id="from_date"
            type="date"
            name="from_date"
            defaultValue={fromDate}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="to_date" className="mb-1 block text-sm font-medium">
            To date
          </label>
          <input
            id="to_date"
            type="date"
            name="to_date"
            defaultValue={toDate}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <button type="submit" className="rounded-md border px-3 py-2 text-sm hover:bg-muted md:col-span-5 md:w-fit">
          Apply filters
        </button>
      </form>

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
                <td className="py-2 pr-4 font-mono text-xs md:text-sm">{ticket.id}</td>
                <td className="py-2 pr-4">
                  <Link
                    href={buildSupportHref({ ...filters, user_id: ticket.user_id, q: undefined })}
                    className="text-primary hover:underline"
                  >
                    {ticket.user_id}
                  </Link>
                </td>
                <td className="py-2 pr-4">{ticket.subject}</td>
                <td className="py-2 pr-4">{ticket.status}</td>
                <td className="py-2 pr-4">{formatDateTime(ticket.created_at)}</td>
                <td className="py-2 pr-4">
                  <Link
                    href={buildTicketDetailHref(ticket.id, filters)}
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

import Link from "next/link";
import { notFound } from "next/navigation";

import { ReplyForm } from "@/components/support/reply-form";
import { supabaseServer } from "@/lib/supabase/server";

type TicketDetailProps = {
  params: Promise<{
    ticket_id: string;
  }>;
  searchParams: Promise<{
    q?: string;
    user_id?: string;
    status?: string;
    from_date?: string;
    to_date?: string;
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

function normalizeStatus(value: unknown): TicketRow["status"] {
  const normalized = asNonEmptyString(value, "").toLowerCase();

  if (normalized === "open" || normalized === "pending" || normalized === "closed") {
    return normalized;
  }

  return "open";
}

function canUseRouteParam(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0 && value !== "-";
}

function buildUserHref(userId: string | null | undefined): string | null {
  if (!canUseRouteParam(userId)) {
    return null;
  }

  return `/admin/users/${userId.trim()}`;
}

function buildSearchHref(queryValue: string | null | undefined): string | null {
  if (!canUseRouteParam(queryValue)) {
    return null;
  }

  const params = new URLSearchParams();
  params.set("q", queryValue.trim());
  return `/admin/search?${params.toString()}`;
}

export default async function SupportTicketDetailPage({
  params,
  searchParams,
}: TicketDetailProps) {  const { ticket_id } = await params;
  const search = await searchParams;

  const q = search.q?.trim() || undefined;
  const userIdFilter = search.user_id?.trim() || undefined;
  const statusFilter = search.status?.trim() || undefined;
  const fromDateFilter = search.from_date?.trim() || undefined;
  const toDateFilter = search.to_date?.trim() || undefined;
  const listParams = new URLSearchParams();

if (q) listParams.set("q", q);
if (userIdFilter) listParams.set("user_id", userIdFilter);
if (statusFilter) listParams.set("status", statusFilter);
if (fromDateFilter) listParams.set("from_date", fromDateFilter);
if (toDateFilter) listParams.set("to_date", toDateFilter);

const listQuery = listParams.toString();
const listHref = listQuery
  ? `/admin/support?${listQuery}`
  : "/admin/support";

  const [{ data: ticketData, error: ticketError }, { data: messagesData, error: messagesError }] =
    await Promise.all([
      supabaseServer
        .from("support_tickets")
        .select("id,user_id,subject,status,created_at")
        .eq("id", ticket_id)
        .single(),
      supabaseServer
        .from("support_ticket_messages")
        .select("id,sender_type,message,created_at")
        .eq("ticket_id", ticket_id)
        .order("created_at", { ascending: true })
        .limit(500),
    ]);

  if (ticketError) {
    if (ticketError.code === "PGRST116") {
      notFound();
    }

    throw new Error(ticketError.message);
  }

  if (messagesError) {
    throw new Error(messagesError.message);
  }

  const rawTicket = ticketData as TicketRow;
  const ticket = {
    id: asNonEmptyString(rawTicket.id, "-"),
    user_id: asNonEmptyString(rawTicket.user_id),
    subject: asNonEmptyString(rawTicket.subject),
    status: normalizeStatus(rawTicket.status),
    created_at: asNonEmptyString(rawTicket.created_at, ""),
  };

  const messages = ((messagesData as TicketMessageRow[] | null) ?? []).map((message) => ({
    id: asNonEmptyString(message.id, "-"),
    sender_type: asNonEmptyString(message.sender_type),
    message: asNonEmptyString(message.message, ""),
    created_at: asNonEmptyString(message.created_at, ""),
  }));

  const userHref = buildUserHref(ticket.user_id);
  const searchHref = buildSearchHref(ticket.id);
  const latestMessageAt = messages.length > 0 ? messages[messages.length - 1]?.created_at ?? "" : "";

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Ticket Detail</h2>
          <Link href={listHref} className="text-xs text-primary hover:underline">
            Back to ticket list
          </Link>
        </div>

        <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Ticket ID</dt>
            <dd>{ticket.id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">User ID</dt>
            <dd>
              {userHref ? (
                <Link href={userHref} className="text-primary hover:underline">
                  {ticket.user_id}
                </Link>
              ) : (
                ticket.user_id
              )}
            </dd>
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
            <dd>{formatDateTime(ticket.created_at)}</dd>
          </div>
        </dl>

        <p className="mt-3 text-xs text-muted-foreground">
          {messages.length} messages · Latest activity {formatDateTime(latestMessageAt)}
          {searchHref ? (
            <>
              {" · "}
              <Link href={searchHref} className="text-primary hover:underline">
                Search ticket references
              </Link>
            </>
          ) : null}
        </p>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Conversation</h2>
        <div className="space-y-3">
          {messages.map((message) => (
            <article key={message.id} className="rounded-md border p-3 text-sm">
              <p className="text-xs text-muted-foreground">
                {message.sender_type} · {formatDateTime(message.created_at)}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{message.message || "-"}</p>
            </article>
          ))}
          {messages.length === 0 ? <p className="text-sm text-muted-foreground">No conversation yet.</p> : null}
        </div>
      </section>

      <ReplyForm ticketId={ticket.id} currentStatus={ticket.status} />
    </div>
  );
}

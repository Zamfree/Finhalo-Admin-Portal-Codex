import {
  MOCK_SUPPORT_TICKETS,
  MOCK_SUPPORT_TICKET_TIMELINE,
} from "@/app/admin/support/_mock-data";
import type {
  SupportTicket,
  SupportTicketTimelineItem,
  SupportWorkspaceData,
} from "@/app/admin/support/_types";
import { createClient } from "@/lib/supabase/server";

type SupportTicketRow = Record<string, unknown>;
type SupportMessageRow = Record<string, unknown>;
const INTERNAL_NOTE_PREFIX = "[Internal Note]";

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeSupportStatus(value: unknown): SupportTicket["status"] {
  switch (value) {
    case "open":
      return "open";
    case "pending":
      return "waiting_user";
    case "in_progress":
      return "in_progress";
    case "resolved":
      return "resolved";
    case "closed":
      return "closed";
    default:
      return "open";
  }
}

function normalizeSupportPriority(value: unknown): SupportTicket["priority"] {
  switch (value) {
    case "low":
    case "medium":
    case "high":
    case "urgent":
      return value;
    default:
      return "medium";
  }
}

function normalizeSupportCategory(value: unknown): SupportTicket["category"] {
  switch (value) {
    case "account":
    case "commission":
    case "rebate":
    case "withdrawal":
    case "finance":
    case "technical":
    case "verification":
    case "general":
      return value;
    default:
      return "general";
  }
}

function normalizeRelatedModule(value: unknown): SupportTicket["related_module"] {
  switch (value) {
    case "accounts":
    case "commission":
    case "finance":
    case "withdrawals":
    case "verification":
    case "technical":
      return value;
    default:
      return null;
  }
}

function mapSupportTicketRow(row: SupportTicketRow): SupportTicket | null {
  const ticketId = asString(row.ticket_id) || asString(row.id);

  if (!ticketId) {
    return null;
  }

  return {
    ticket_id: ticketId,
    subject: asString(row.subject, "Support Case"),
    category: normalizeSupportCategory(row.category),
    priority: normalizeSupportPriority(row.priority),
    status: normalizeSupportStatus(row.status),
    user_id: asString(row.user_id, "UNKNOWN"),
    user_email: asString(row.user_email, "unknown@support.local"),
    account_id: asString(row.account_id) || null,
    related_module: normalizeRelatedModule(row.related_module),
    commission_id: asString(row.commission_id) || null,
    rebate_record_id: asString(row.rebate_record_id) || null,
    ledger_ref: asString(row.ledger_ref) || null,
    withdrawal_id: asString(row.withdrawal_id) || null,
    created_at: asString(row.created_at, new Date().toISOString()),
    updated_at: asString(row.updated_at, asString(row.created_at, new Date().toISOString())),
  };
}

function mapSupportMessageRow(row: SupportMessageRow): SupportTicketTimelineItem | null {
  const messageId = asString(row.message_id) || asString(row.id);
  const ticketId = asString(row.ticket_id);

  if (!messageId || !ticketId) {
    return null;
  }

  const authorType =
    row.author_type === "user" || row.author_type === "admin" || row.author_type === "system"
      ? row.author_type
      : row.sender_type === "admin" || row.sender_type === "user"
        ? row.sender_type
        : "system";

  const authorName =
    asString(row.author_name) ||
    (authorType === "admin"
      ? "Admin"
      : authorType === "user"
        ? "User"
        : "System");

  const rawBody = asString(row.body) || asString(row.message);
  const isInternal =
    row.is_internal === true ||
    rawBody.startsWith(INTERNAL_NOTE_PREFIX);
  const body = isInternal ? rawBody.replace(INTERNAL_NOTE_PREFIX, "").trim() : rawBody;

  return {
    message_id: messageId,
    ticket_id: ticketId,
    author_type: authorType,
    author_name: authorName,
    body,
    created_at: asString(row.created_at, new Date().toISOString()),
    is_internal: isInternal,
  };
}

async function getSupportWorkspaceFromSupabase(): Promise<SupportWorkspaceData | null> {
  try {
    const supabase = await createClient();
    const { data: ticketRows, error: ticketError } = await supabase
      .from("support_tickets")
      .select("*")
      .order("updated_at", { ascending: false });

    if (ticketError || !ticketRows || ticketRows.length === 0) {
      return null;
    }

    const tickets = (ticketRows as SupportTicketRow[])
      .map(mapSupportTicketRow)
      .filter((ticket): ticket is SupportTicket => Boolean(ticket));

    const ticketIds = tickets.map((ticket) => ticket.ticket_id);
    const timelineByTicket: Record<string, SupportTicketTimelineItem[]> = {};

    if (ticketIds.length > 0) {
      const { data: messageRows } = await supabase
        .from("support_ticket_messages")
        .select("*")
        .in("ticket_id", ticketIds)
        .order("created_at", { ascending: true });

      for (const item of (messageRows as SupportMessageRow[] | null) ?? []) {
        const message = mapSupportMessageRow(item);

        if (!message) {
          continue;
        }

        timelineByTicket[message.ticket_id] = [
          ...(timelineByTicket[message.ticket_id] ?? []),
          message,
        ];
      }
    }

    return {
      tickets,
      timelineByTicket,
    };
  } catch {
    return null;
  }
}

function getSupportWorkspaceFromMock(): SupportWorkspaceData {
  return {
    tickets: MOCK_SUPPORT_TICKETS,
    timelineByTicket: MOCK_SUPPORT_TICKET_TIMELINE,
  };
}

export async function getAdminSupportWorkspace(): Promise<SupportWorkspaceData> {
  return (await getSupportWorkspaceFromSupabase()) ?? getSupportWorkspaceFromMock();
}

export async function getAdminSupportTicketDetail(ticketId: string) {
  const workspace = await getAdminSupportWorkspace();
  const ticket = workspace.tickets.find((row) => row.ticket_id === ticketId) ?? null;
  const timeline = ticket ? workspace.timelineByTicket[ticket.ticket_id] ?? [] : [];

  return {
    ticket,
    timeline,
  };
}

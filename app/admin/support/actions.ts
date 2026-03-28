"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type ReplyState = {
  error?: string;
  success?: string;
};

const VALID_STATUS = new Set(["open", "pending", "closed"]);
const VALID_HANDOFF_MODULES = [
  "users",
  "accounts",
  "commission",
  "finance",
  "withdrawals",
  "verification",
  "technical",
] as const;

type SupportHandoffModule = (typeof VALID_HANDOFF_MODULES)[number];
type SupportTicketRelatedModule =
  | "accounts"
  | "commission"
  | "finance"
  | "withdrawals"
  | "verification"
  | "technical";

export async function replyTicketAction(_prev: ReplyState, formData: FormData): Promise<ReplyState> {
  const supabase = await createClient();
  const ticketId = String(formData.get("ticket_id") ?? "").trim();
  const replyMessage = String(formData.get("reply_message") ?? "").trim();
  const nextStatus = String(formData.get("next_status") ?? "pending").trim();

  if (!ticketId) {
    return { error: "Ticket ID is required." };
  }

  if (!replyMessage) {
    return { error: "Reply message is required." };
  }

  if (!VALID_STATUS.has(nextStatus)) {
    return { error: "Invalid ticket status." };
  }

  const { error: insertReplyError } = await supabase.from("support_ticket_messages").insert({
    ticket_id: ticketId,
    sender_type: "admin",
    message: replyMessage,
    created_at: new Date().toISOString(),
  });

  if (insertReplyError) {
    return { error: insertReplyError.message };
  }

  const { error: updateStatusError } = await supabase
    .from("support_tickets")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  if (updateStatusError) {
    return { error: updateStatusError.message };
  }

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);

  return { success: `Reply sent. Ticket marked as ${nextStatus}.` };
}

export async function addInternalNoteAction(
  _prev: ReplyState,
  formData: FormData
): Promise<ReplyState> {
  const supabase = await createClient();
  const ticketId = String(formData.get("ticket_id") ?? "").trim();
  const note = String(formData.get("internal_note") ?? "").trim();

  if (!ticketId) {
    return { error: "Ticket ID is required." };
  }

  if (!note) {
    return { error: "Internal note is required." };
  }

  const { error: insertNoteError } = await supabase.from("support_ticket_messages").insert({
    ticket_id: ticketId,
    sender_type: "admin",
    message: `[Internal Note] ${note}`,
    created_at: new Date().toISOString(),
  });

  if (insertNoteError) {
    return { error: insertNoteError.message };
  }

  const { error: updateStatusError } = await supabase
    .from("support_tickets")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  if (updateStatusError) {
    return { error: updateStatusError.message };
  }

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);

  return { success: "Internal note saved." };
}

function normalizeAnnouncementStatus(rawStatus: string): "draft" | "published" {
  return rawStatus.trim().toLowerCase() === "draft" ? "draft" : "published";
}

export async function publishAnnouncementAction(
  _prev: ReplyState,
  formData: FormData
): Promise<ReplyState> {
  const supabase = await createClient();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const status = normalizeAnnouncementStatus(String(formData.get("status") ?? "published"));

  if (!title) {
    return { error: "Announcement title is required." };
  }

  if (!body) {
    return { error: "Announcement body is required." };
  }

  const payloadAttempts: Array<Record<string, unknown>> = [
    {
      title,
      body,
      status,
      created_by: "Support Admin",
      created_at: new Date().toISOString(),
    },
    {
      subject: title,
      message: body,
      status,
      actor: "Support Admin",
      created_at: new Date().toISOString(),
    },
  ];

  const tableAttempts = ["system_announcements", "support_announcements"] as const;
  let lastError = "Failed to publish announcement.";

  for (const tableName of tableAttempts) {
    for (const payload of payloadAttempts) {
      const { error } = await supabase.from(tableName).insert(payload);
      if (!error) {
        revalidatePath("/admin/support");
        return { success: "System announcement published." };
      }
      lastError = error.message;
    }
  }

  return { error: lastError };
}

export async function sendAdminMessageAction(
  _prev: ReplyState,
  formData: FormData
): Promise<ReplyState> {
  const supabase = await createClient();
  const targetUserId = String(formData.get("target_user_id") ?? "").trim();
  const targetEmail = String(formData.get("target_email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!targetUserId && !targetEmail) {
    return { error: "Target user ID or target email is required." };
  }

  if (!subject) {
    return { error: "Message subject is required." };
  }

  if (!body) {
    return { error: "Message body is required." };
  }

  const payloadAttempts: Array<Record<string, unknown>> = [
    {
      target_user_id: targetUserId || null,
      target_email: targetEmail || null,
      subject,
      body,
      sent_by: "Support Admin",
      created_at: new Date().toISOString(),
    },
    {
      user_id: targetUserId || null,
      user_email: targetEmail || null,
      subject,
      message: body,
      created_by: "Support Admin",
      created_at: new Date().toISOString(),
    },
  ];

  const tableAttempts = ["support_admin_messages", "admin_messages"] as const;
  let lastError = "Failed to send admin message.";

  for (const tableName of tableAttempts) {
    for (const payload of payloadAttempts) {
      const { error } = await supabase.from(tableName).insert(payload);
      if (!error) {
        revalidatePath("/admin/support");
        return { success: "Admin message sent." };
      }
      lastError = error.message;
    }
  }

  return { error: lastError };
}

function normalizeHandoffModule(rawValue: string): SupportHandoffModule | null {
  const normalized = rawValue.trim().toLowerCase();

  if (VALID_HANDOFF_MODULES.includes(normalized as SupportHandoffModule)) {
    return normalized as SupportHandoffModule;
  }

  return null;
}

function toTicketRelatedModule(moduleKey: SupportHandoffModule): SupportTicketRelatedModule | null {
  if (moduleKey === "users") {
    return null;
  }

  return moduleKey;
}

function formatHandoffModuleLabel(moduleKey: SupportHandoffModule): string {
  switch (moduleKey) {
    case "users":
      return "Users";
    case "accounts":
      return "Accounts";
    case "commission":
      return "Commission";
    case "finance":
      return "Finance";
    case "withdrawals":
      return "Withdrawals";
    case "verification":
      return "Verification";
    case "technical":
      return "Technical";
    default:
      return "Support";
  }
}

function isMissingColumnError(message: string) {
  return /column .* does not exist/i.test(message);
}

function isMissingTableError(message: string) {
  return /relation .* does not exist|table .* does not exist/i.test(message);
}

async function queueSupportHandoffOperation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ticketId: string,
  targetModule: SupportHandoffModule,
  note: string
) {
  const now = new Date().toISOString();
  const moduleLabel = formatHandoffModuleLabel(targetModule);
  const payloadAttempts: Array<Record<string, unknown>> = [
    {
      operation_key: "support_handoff",
      operation_title: `Support handoff for ${ticketId}`,
      linked_module: moduleLabel,
      status: "queued",
      parameters: {
        ticket_id: ticketId,
        target_module: targetModule,
        note: note || null,
      },
      created_by: "Support Admin",
      created_at: now,
    },
    {
      key: "support_handoff",
      title: `Support handoff for ${ticketId}`,
      module: moduleLabel,
      state: "queued",
      payload: {
        ticket_id: ticketId,
        target_module: targetModule,
        note: note || null,
      },
      actor: "Support Admin",
      created_at: now,
    },
  ];

  let lastError = "Failed to queue support handoff action.";

  for (const payload of payloadAttempts) {
    const { error } = await supabase.from("admin_operation_queue").insert(payload);

    if (!error) {
      return { ok: true as const };
    }

    lastError = error.message;

    if (!isMissingColumnError(error.message)) {
      break;
    }
  }

  if (isMissingTableError(lastError)) {
    return { ok: false as const, queueUnavailable: true as const };
  }

  return { ok: false as const, error: lastError };
}

async function appendSupportTimelineHandoffNote(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ticketId: string,
  targetModule: SupportHandoffModule,
  note: string
) {
  const moduleLabel = formatHandoffModuleLabel(targetModule);
  const message = note
    ? `[Handoff Queue] Routed to ${moduleLabel}. Note: ${note}`
    : `[Handoff Queue] Routed to ${moduleLabel}.`;
  const payloadAttempts: Array<Record<string, unknown>> = [
    {
      ticket_id: ticketId,
      sender_type: "system",
      message,
      is_internal: true,
      author_type: "system",
      author_name: "Support Queue",
      created_at: new Date().toISOString(),
    },
    {
      ticket_id: ticketId,
      sender_type: "system",
      message,
      created_at: new Date().toISOString(),
    },
  ];

  for (const payload of payloadAttempts) {
    const { error } = await supabase.from("support_ticket_messages").insert(payload);

    if (!error) {
      return { ok: true as const };
    }

    if (!isMissingColumnError(error.message)) {
      return { ok: false as const, error: error.message };
    }
  }

  return { ok: false as const, error: "Failed to write support timeline note." };
}

async function updateSupportTicketHandoffModule(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ticketId: string,
  targetModule: SupportHandoffModule
) {
  const relatedModule = toTicketRelatedModule(targetModule);
  const payloadAttempts: Array<Record<string, unknown>> = relatedModule
    ? [
        { related_module: relatedModule, updated_at: new Date().toISOString() },
        { related_module: relatedModule },
        { updated_at: new Date().toISOString() },
      ]
    : [{ updated_at: new Date().toISOString() }];

  const keyAttempts = ["ticket_id", "id"] as const;

  for (const key of keyAttempts) {
    for (const payload of payloadAttempts) {
      const { data, error } = await supabase
        .from("support_tickets")
        .update(payload)
        .eq(key, ticketId)
        .select(key)
        .maybeSingle();

      if (!error && data) {
        return { ok: true as const };
      }

      if (error && !isMissingColumnError(error.message)) {
        return { ok: false as const, error: error.message };
      }
    }
  }

  return { ok: false as const, error: `Ticket ${ticketId} was not found.` };
}

export async function queueSupportHandoffAction(
  _prev: ReplyState,
  formData: FormData
): Promise<ReplyState> {
  const supabase = await createClient();
  const ticketId = String(formData.get("ticket_id") ?? "").trim();
  const rawTargetModule = String(formData.get("target_module") ?? "").trim();
  const note = String(formData.get("handoff_note") ?? "").trim();
  const targetModule = normalizeHandoffModule(rawTargetModule);

  if (!ticketId) {
    return { error: "Ticket ID is required." };
  }

  if (!targetModule) {
    return { error: "Please choose a valid handoff module." };
  }

  const ticketUpdated = await updateSupportTicketHandoffModule(supabase, ticketId, targetModule);
  if (!ticketUpdated.ok) {
    return { error: ticketUpdated.error };
  }

  const timelineUpdated = await appendSupportTimelineHandoffNote(
    supabase,
    ticketId,
    targetModule,
    note
  );
  if (!timelineUpdated.ok) {
    return { error: timelineUpdated.error };
  }

  const queued = await queueSupportHandoffOperation(supabase, ticketId, targetModule, note);

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);

  if (!queued.ok && !queued.queueUnavailable) {
    return { error: queued.error };
  }

  if (!queued.ok && queued.queueUnavailable) {
    return {
      success:
        "Handoff note recorded on the ticket timeline. Queue table is unavailable in this environment.",
    };
  }

  return {
    success: `Handoff queued to ${formatHandoffModuleLabel(targetModule)} for ${ticketId}.`,
  };
}

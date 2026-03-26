"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

type ReplyState = {
  error?: string;
  success?: string;
};

const VALID_STATUS = new Set(["open", "pending", "closed"]);

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

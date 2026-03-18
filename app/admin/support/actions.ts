"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer } from "@/lib/supabase/server";

type ReplyState = {
  error?: string;
  success?: string;
};

const ALLOWED_STATUSES = new Set(["open", "pending", "closed"]);

export async function replyTicketAction(_prevState: ReplyState, formData: FormData): Promise<ReplyState> {
  const ticketId = String(formData.get("ticket_id") ?? "").trim();
  const reply = String(formData.get("reply") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!ticketId) {
    return { error: "Ticket ID is required." };
  }

  if (!reply) {
    return { error: "Reply message is required." };
  }

  if (!ALLOWED_STATUSES.has(status)) {
    return { error: "Invalid ticket status." };
  }

  const { data: ticket, error: ticketError } = await supabaseServer
    .from("support_tickets")
    .select("id,status")
    .eq("id", ticketId)
    .maybeSingle();

  if (ticketError) {
    return { error: ticketError.message };
  }

  if (!ticket) {
    return { error: "Ticket not found." };
  }

  const { error: messageError } = await supabaseServer.from("support_ticket_messages").insert({
    ticket_id: ticketId,
    sender_type: "admin",
    message: reply,
  });

  if (messageError) {
    return { error: messageError.message };
  }

  const { error: updateError } = await supabaseServer
    .from("support_tickets")
    .update({ status })
    .eq("id", ticketId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);

  return { success: "Reply sent successfully." };
}

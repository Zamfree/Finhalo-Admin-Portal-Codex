export type SupportTicketCategory =
  | "account"
  | "commission"
  | "rebate"
  | "withdrawal"
  | "finance"
  | "technical"
  | "verification"
  | "general";

export type SupportTicketStatus =
  | "open"
  | "in_progress"
  | "waiting_user"
  | "resolved"
  | "closed";

export type SupportTicketPriority = "low" | "medium" | "high" | "urgent";

export type SupportRelatedModule =
  | "accounts"
  | "commission"
  | "finance"
  | "withdrawals"
  | "verification"
  | "technical"
  | null;

export type SupportTicket = {
  ticket_id: string;
  subject: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  user_id: string;
  user_email: string;
  account_id: string | null;
  related_module: SupportRelatedModule;
  commission_id?: string | null;
  rebate_record_id?: string | null;
  ledger_ref?: string | null;
  withdrawal_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type SupportTicketTimelineItem = {
  message_id: string;
  ticket_id: string;
  author_type: "user" | "admin" | "system";
  author_name: string;
  body: string;
  created_at: string;
};

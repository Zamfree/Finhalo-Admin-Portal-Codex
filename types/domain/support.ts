export type SupportTicketStatus = "open" | "in_progress" | "waiting_user" | "resolved" | "closed";
export type SupportTicketPriority = "low" | "medium" | "high" | "urgent";

export type SupportTicket = {
  ticketId: string;
  subject: string;
  category: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  userId: string;
  userEmail: string;
  accountId: string | null;
  updatedAt: string;
};

export type SupportTicketTimelineItem = {
  messageId: string;
  ticketId: string;
  authorType: "user" | "admin" | "system";
  authorName: string;
  body: string;
  createdAt: string;
};

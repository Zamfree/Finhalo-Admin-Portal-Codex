import type { FilterBarBaseProps } from "@/types/system/filters";

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
  is_internal?: boolean;
};

export type SupportFilters = {
  query: string;
  status: "all" | SupportTicketStatus;
  category: "all" | SupportTicketCategory;
};

export type SupportDrawerTab = "overview" | "context" | "timeline" | "handoff";

export type SupportWorkflowStageKey =
  | "intake"
  | "investigation"
  | "validation"
  | "resolution";

export type SupportWorkflowStageState = "complete" | "current" | "upcoming";

export type SupportWorkflowStage = {
  key: SupportWorkflowStageKey;
  label: string;
  description: string;
  state: SupportWorkflowStageState;
};

export type SupportWorkflowModel = {
  currentStageLabel: string;
  nextAction: string;
  recommendedModuleLabel: string;
  stages: SupportWorkflowStage[];
};

export type SupportReplyActionStatus = "open" | "pending" | "closed";

export type SupportActionPosture = {
  actionStatus: SupportReplyActionStatus;
  actionStatusLabel: string;
  nextReplyStatus: SupportReplyActionStatus;
  nextReplyStatusLabel: string;
  serverActionReady: boolean;
  actionNote: string;
};

export type SupportWorkspaceData = {
  tickets: SupportTicket[];
  timelineByTicket: Record<string, SupportTicketTimelineItem[]>;
  announcements: SupportAnnouncement[];
  outboundMessages: SupportOutboundMessage[];
};

export type SupportAnnouncement = {
  announcement_id: string;
  title: string;
  body: string;
  status: "draft" | "published";
  created_at: string;
  created_by: string;
};

export type SupportOutboundMessage = {
  message_id: string;
  target_user_id: string | null;
  target_email: string | null;
  subject: string;
  body: string;
  created_at: string;
  sent_by: string;
};

export type SummaryMetric = {
  key: "total" | "open" | "in_progress" | "resolved";
  value: number;
};

export type SupportFilterControls = Pick<
  FilterBarBaseProps<SupportFilters>,
  "inputFilters" | "setInputFilter" | "applyFilters" | "clearFilters"
>;

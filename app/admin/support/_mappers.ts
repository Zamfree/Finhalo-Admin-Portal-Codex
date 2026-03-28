import type { SupportTicket } from "./_types";
import type {
  SupportActionPosture,
  SummaryMetric,
  SupportFilters,
  SupportWorkflowModel,
  SupportWorkflowStage,
  SupportWorkflowStageKey,
} from "./_types";

export function filterSupportTickets(
  rows: SupportTicket[],
  filters: SupportFilters
): SupportTicket[] {
  const query = filters.query.trim().toLowerCase();

  return rows.filter((row) => {
    const matchesQuery =
      !query ||
      row.ticket_id.toLowerCase().includes(query) ||
      row.subject.toLowerCase().includes(query) ||
      row.user_email.toLowerCase().includes(query) ||
      row.user_id.toLowerCase().includes(query) ||
      row.account_id?.toLowerCase().includes(query);

    const matchesStatus = filters.status === "all" || row.status === filters.status;
    const matchesCategory = filters.category === "all" || row.category === filters.category;

    return matchesQuery && matchesStatus && matchesCategory;
  });
}

export function getSupportSummaryMetrics(rows: SupportTicket[]): SummaryMetric[] {
  return [
    {
      key: "total",
      value: rows.length,
    },
    {
      key: "open",
      value: rows.filter((row) => row.status === "open").length,
    },
    {
      key: "in_progress",
      value: rows.filter((row) => row.status === "in_progress").length,
    },
    {
      key: "resolved",
      value: rows.filter((row) => row.status === "resolved").length,
    },
  ];
}

function getRecommendedModuleLabel(ticket: SupportTicket) {
  switch (ticket.related_module) {
    case "accounts":
      return "Trading Accounts";
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
      return ticket.account_id ? "Trading Accounts" : "Users";
  }
}

function getWorkflowCursor(ticket: SupportTicket): SupportWorkflowStageKey {
  switch (ticket.status) {
    case "open":
      return "intake";
    case "in_progress":
      return "investigation";
    case "waiting_user":
      return "validation";
    case "resolved":
    case "closed":
      return "resolution";
    default:
      return "intake";
  }
}

function getNextAction(ticket: SupportTicket) {
  switch (ticket.status) {
    case "open":
      return ticket.account_id
        ? "Confirm requester identity and validate the linked account context."
        : "Confirm requester identity and identify the missing linked record context.";
    case "in_progress":
      return `Review the case against ${getRecommendedModuleLabel(ticket)} before deciding the next handoff.`;
    case "waiting_user":
      return "Wait for requester confirmation or missing evidence before resuming the investigation.";
    case "resolved":
      return "Verify the operational resolution path, then prepare the ticket for closure.";
    case "closed":
      return "Case is closed. Re-open only if linked records show a new discrepancy.";
    default:
      return "Review the case context and confirm the next operational handoff.";
  }
}

export function getSupportWorkflow(ticket: SupportTicket): SupportWorkflowModel {
  const cursor = getWorkflowCursor(ticket);
  const order: SupportWorkflowStageKey[] = [
    "intake",
    "investigation",
    "validation",
    "resolution",
  ];
  const cursorIndex = order.indexOf(cursor);

  const stages: SupportWorkflowStage[] = [
    {
      key: "intake",
      label: "Intake",
      description: "Confirm requester identity, issue type, and whether the ticket has enough context to investigate.",
      state: "upcoming",
    },
    {
      key: "investigation",
      label: "Investigation",
      description: "Review linked user, account, commission, rebate, finance, or withdrawal context.",
      state: "upcoming",
    },
    {
      key: "validation",
      label: "Validation",
      description: "Wait for user evidence or validate that linked records support the operational conclusion.",
      state: "upcoming",
    },
    {
      key: "resolution",
      label: "Resolution",
      description: "Hand off into the right operational module, confirm the outcome, and close the case.",
      state: "upcoming",
    },
  ].map((stage, index): SupportWorkflowStage => ({
    key: stage.key as SupportWorkflowStageKey,
    label: stage.label,
    description: stage.description,
    state:
      index < cursorIndex
        ? "complete"
        : index === cursorIndex
          ? "current"
          : "upcoming",
  }));

  return {
    currentStageLabel: stages[cursorIndex]?.label ?? "Intake",
    nextAction: getNextAction(ticket),
    recommendedModuleLabel: getRecommendedModuleLabel(ticket),
    stages,
  };
}

export function getSupportActionPosture(ticket: SupportTicket): SupportActionPosture {
  switch (ticket.status) {
    case "open":
      return {
        actionStatus: "open",
        actionStatusLabel: "Open Intake",
        nextReplyStatus: "pending",
        nextReplyStatusLabel: "Pending User Reply",
        serverActionReady: true,
        actionNote: "A first admin reply should move the case into a pending follow-up state while investigation begins.",
      };
    case "in_progress":
      return {
        actionStatus: "pending",
        actionStatusLabel: "Investigation Active",
        nextReplyStatus: "pending",
        nextReplyStatusLabel: "Pending User Reply",
        serverActionReady: true,
        actionNote: "The current investigation stage maps cleanly onto the shared pending reply state used by the server action.",
      };
    case "waiting_user":
      return {
        actionStatus: "pending",
        actionStatusLabel: "Waiting for User",
        nextReplyStatus: "pending",
        nextReplyStatusLabel: "Pending User Reply",
        serverActionReady: true,
        actionNote: "Reply flow stays inside the pending state until the requester provides the missing evidence or confirmation.",
      };
    case "resolved":
      return {
        actionStatus: "pending",
        actionStatusLabel: "Resolution Review",
        nextReplyStatus: "closed",
        nextReplyStatusLabel: "Closed",
        serverActionReady: true,
        actionNote: "Resolved cases are still reviewable. A final admin reply can close the ticket once the outcome is confirmed.",
      };
    case "closed":
      return {
        actionStatus: "closed",
        actionStatusLabel: "Closed",
        nextReplyStatus: "closed",
        nextReplyStatusLabel: "Closed",
        serverActionReady: false,
        actionNote: "Closed cases remain readable, but active reply handling should stay disabled unless the workflow is reopened.",
      };
    default:
      return {
        actionStatus: "open",
        actionStatusLabel: "Open Intake",
        nextReplyStatus: "pending",
        nextReplyStatusLabel: "Pending User Reply",
        serverActionReady: true,
        actionNote: "Review the case and move it into the shared pending reply state when operational context is ready.",
      };
  }
}

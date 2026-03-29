import type { WithdrawalRow } from "../../_types";

export type WithdrawalChecklistItem = {
  label: string;
  passed: boolean;
};

export const WITHDRAWAL_WORKFLOW_STEPS: WithdrawalRow["status"][] = [
  "requested",
  "under_review",
  "approved",
  "processing",
  "completed",
];

export function getWithdrawalStepState(
  current: WithdrawalRow["status"],
  step: WithdrawalRow["status"]
) {
  if (current === "rejected" || current === "failed" || current === "cancelled") {
    return "terminal";
  }

  const currentIndex = WITHDRAWAL_WORKFLOW_STEPS.indexOf(current);
  const stepIndex = WITHDRAWAL_WORKFLOW_STEPS.indexOf(step);
  if (stepIndex < 0 || currentIndex < 0) {
    return "pending";
  }

  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex) return "active";
  return "pending";
}

export function getWithdrawalChecklist(withdrawal: WithdrawalRow): WithdrawalChecklistItem[] {
  const hasDestination = Boolean(withdrawal.destination && withdrawal.destination.trim() !== "-");
  const validAmount = withdrawal.request_amount > 0 && withdrawal.net_amount >= 0;
  const feeSafe = withdrawal.fee_amount <= withdrawal.request_amount;
  const reviewedIdentity =
    withdrawal.status === "requested" ||
    Boolean(withdrawal.reviewed_by || withdrawal.reviewed_at);
  const processedIdentity =
    !["processing", "completed", "failed"].includes(withdrawal.status) ||
    Boolean(withdrawal.processed_by || withdrawal.processed_at);
  const terminalHasReason =
    !["rejected", "failed", "cancelled"].includes(withdrawal.status) ||
    Boolean(withdrawal.rejection_reason && withdrawal.rejection_reason.trim().length > 0);
  const completedHasPayout =
    withdrawal.status !== "completed" || Boolean(withdrawal.payout_ledger_ref);

  return [
    { label: "Destination present", passed: hasDestination },
    { label: "Amount and net values valid", passed: validAmount },
    { label: "Fee does not exceed request", passed: feeSafe },
    { label: "Review actor/timestamp traceable", passed: reviewedIdentity },
    { label: "Processing actor/timestamp traceable", passed: processedIdentity },
    { label: "Terminal reason captured", passed: terminalHasReason },
    { label: "Completed payout ledger linked", passed: completedHasPayout },
  ];
}

export function getWithdrawalCurrentActionHint(status: WithdrawalRow["status"]) {
  if (status === "requested") return "Start manual review.";
  if (status === "under_review") return "Decide approve, reject, or cancel.";
  if (status === "approved") return "Move to processing or completed when payout is done.";
  if (status === "processing") return "Mark completed on payout confirmation, otherwise failed.";
  if (status === "completed") return "No more state transition; keep for audit.";
  if (status === "failed") return "Capture failure cause and confirm reserve release path.";
  if (status === "rejected") return "Keep rejection reason and evidence available.";
  return "Cancelled request should remain audit-visible only.";
}

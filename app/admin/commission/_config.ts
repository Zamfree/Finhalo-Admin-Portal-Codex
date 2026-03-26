import type { CommissionWorkspaceTab } from "./_types";

export const COMMISSION_QUERY_PARAM_CONFIG = {
  tabKey: "tab",
  accountIdKey: "account_id",
} as const;

export const COMMISSION_DRAWER_QUERY_CONFIG = {
  detailKey: "detail_commission_id",
  tabKey: "drawer",
} as const;

export function getCommissionWorkspaceTitle(tab: CommissionWorkspaceTab) {
  if (tab === "inputs") {
    return "Broker Inputs";
  }

  if (tab === "allocation") {
    return "Commission Breakdown";
  }

  return "Rebate Records";
}

export function getCommissionWorkspaceDescription(tab: CommissionWorkspaceTab) {
  if (tab === "inputs") {
    return "Review imported broker inputs before validation and downstream breakdown.";
  }

  if (tab === "allocation") {
    return "Inspect commission split outputs and use the drawer for waterfall detail, relationship context, and finance handoff.";
  }

  return "Review finalized rebate entries generated from the commission breakdown pipeline.";
}

export function getStatusBadgeClass(status: string) {
  switch (status) {
    case "processed":
    case "posted":
      return "bg-emerald-500/10 text-emerald-300";
    case "validated":
    case "pending":
      return "bg-amber-500/10 text-amber-300";
    case "imported":
      return "bg-blue-500/10 text-blue-300";
    default:
      return "bg-zinc-500/10 text-zinc-300";
  }
}

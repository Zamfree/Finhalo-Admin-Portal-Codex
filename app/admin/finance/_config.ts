import type { LedgerDrawerTab, WithdrawalDrawerTab } from "./_types";

export const LEDGER_DRAWER_QUERY_CONFIG = {
  detailKey: "detail_ledger_ref",
  tabKey: "drawer",
} as const;

export const WITHDRAWAL_DRAWER_QUERY_CONFIG = {
  detailKey: "detail_withdrawal_id",
  tabKey: "drawer",
} as const;

export function getLedgerDrawerTabLabel(tab: LedgerDrawerTab) {
  switch (tab) {
    case "overview":
      return "Overview";
    case "context":
      return "Context";
    case "references":
      return "References";
    default:
      return tab;
  }
}

export function getWithdrawalDrawerTabLabel(tab: WithdrawalDrawerTab) {
  switch (tab) {
    case "overview":
      return "Overview";
    case "context":
      return "Context";
    case "references":
      return "References";
    default:
      return tab;
  }
}

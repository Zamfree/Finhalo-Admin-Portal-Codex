import type { LedgerDrawerTab, LedgerFilters, WithdrawalDrawerTab, WithdrawalFilters } from "./_types";

export const LEDGER_DEFAULT_FILTERS: LedgerFilters = {
  query: "",
  status: "all",
};

export const WITHDRAWAL_DEFAULT_FILTERS: WithdrawalFilters = {
  query: "",
  status: "all",
};

export const LEDGER_DRAWER_TABS: readonly LedgerDrawerTab[] = [
  "overview",
  "context",
  "references",
  "handoff",
];

export const WITHDRAWAL_DRAWER_TABS: readonly WithdrawalDrawerTab[] = [
  "overview",
  "context",
  "references",
  "handoff",
];

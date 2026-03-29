import type {
  LedgerDrawerTab,
  LedgerViewerFilters,
  WithdrawalDrawerTab,
  WithdrawalFilters,
} from "./_types";

export const LEDGER_DEFAULT_FILTERS: LedgerViewerFilters = {
  query: "",
  user_id: "",
  account_id: "",
  transaction_type: "",
  direction: "all",
  status: "all",
  reference_type: "",
  reference_id: "",
  batch_id: "",
  ledger_ref: "",
  rebate_record_id: "",
  date_from: "",
  date_to: "",
};

export const WITHDRAWAL_DEFAULT_FILTERS: WithdrawalFilters = {
  query: "",
  status: "all",
  user_id: "",
  account_id: "",
  currency: "",
  payout_method: "",
  date_from: "",
  date_to: "",
};

export const LEDGER_DRAWER_TABS: readonly LedgerDrawerTab[] = [
  "overview",
  "context",
  "references",
];

export const WITHDRAWAL_DRAWER_TABS: readonly WithdrawalDrawerTab[] = [
  "overview",
  "context",
  "references",
];

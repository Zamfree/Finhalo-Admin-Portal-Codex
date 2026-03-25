import { MOCK_TRADING_ACCOUNTS } from "../accounts/_mock-data";
import type { TradingAccountRecord } from "../accounts/_types";
import type { UserRow } from "@/types/user";

export const MOCK_USERS: UserRow[] = [
  {
    user_id: "USR-1001",
    email: "alice@example.com",
    display_name: "Alice Tan",
    user_type: "trader",
    status: "active",
    created_at: "2026-01-10T09:10:00Z",
  },
  {
    user_id: "USR-1002",
    email: "bob@example.com",
    display_name: "Brian Koh",
    user_type: "trader",
    status: "active",
    created_at: "2026-01-16T10:45:00Z",
  },
  {
    user_id: "USR-1003",
    email: "charlie@example.com",
    display_name: "Carla Ong",
    user_type: "trader",
    status: "active",
    created_at: "2026-01-28T08:05:00Z",
  },
  {
    user_id: "USR-1004",
    email: "diana@example.com",
    display_name: "Derek Yeo",
    user_type: "ib",
    status: "active",
    created_at: "2026-02-02T14:15:00Z",
  },
  {
    user_id: "USR-1005",
    email: "evan@example.com",
    display_name: "Emily Tan",
    user_type: "trader",
    status: "restricted",
    created_at: "2026-02-14T12:20:00Z",
  },
  {
    user_id: "USR-1006",
    email: "fiona@example.com",
    display_name: "Fiona Lee",
    user_type: "trader",
    status: "suspended",
    created_at: "2026-02-21T17:30:00Z",
  },
];

export type UserRelatedSummary = {
  commission_summary: string;
  finance_summary: string;
  rebate_summary: string;
};

export const MOCK_USER_ACTIVITY_SUMMARY: Record<string, UserRelatedSummary> = {
  "USR-1001": {
    commission_summary: "14 commission records across 2 owned trading accounts.",
    finance_summary: "9 finance ledger entries linked to downstream account activity.",
    rebate_summary: "12 rebate records generated from account-level commission flow.",
  },
  "USR-1002": {
    commission_summary: "10 commission records across 1 owned trading account.",
    finance_summary: "6 finance ledger entries linked to downstream account activity.",
    rebate_summary: "8 rebate records generated from account-level commission flow.",
  },
  "USR-1003": {
    commission_summary: "7 commission records across 1 owned trading account.",
    finance_summary: "5 finance ledger entries linked to downstream account activity.",
    rebate_summary: "7 rebate records generated from account-level commission flow.",
  },
  "USR-1004": {
    commission_summary: "11 commission records across 1 owned trading account.",
    finance_summary: "7 finance ledger entries linked to downstream account activity.",
    rebate_summary: "9 rebate records generated from account-level commission flow.",
  },
  "USR-1005": {
    commission_summary: "4 commission records across 1 owned trading account.",
    finance_summary: "3 finance ledger entries linked to downstream account activity.",
    rebate_summary: "3 rebate records generated from account-level commission flow.",
  },
  "USR-1006": {
    commission_summary: "No downstream commission activity yet.",
    finance_summary: "No downstream finance activity yet.",
    rebate_summary: "No downstream rebate activity yet.",
  },
};

export function getAccountsForUser(userId: string): TradingAccountRecord[] {
  return MOCK_TRADING_ACCOUNTS.filter((account) => account.user_id === userId);
}

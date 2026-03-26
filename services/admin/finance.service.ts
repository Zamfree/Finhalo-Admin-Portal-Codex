import {
  MOCK_ADJUSTMENTS,
  MOCK_FINANCE_HUB_DATA,
  MOCK_LEDGER_ROWS,
  MOCK_RECONCILIATION_ROWS,
  MOCK_WITHDRAWALS,
} from "@/app/admin/finance/_mock-data";
import type {
  AdjustmentRow,
  FinanceHubData,
  LedgerRow,
  ReconciliationRow,
  WithdrawalRow,
} from "@/app/admin/finance/_types";
import { createClient } from "@/lib/supabase/server";

type DbRow = Record<string, unknown>;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapLedgerRow(row: DbRow): LedgerRow | null {
  const ledgerRef = asString(row.ledger_ref) || asString(row.id);

  if (!ledgerRef) {
    return null;
  }

  const direction: LedgerRow["direction"] =
    asString(row.direction) === "debit" ? "debit" : "credit";
  const rawStatus = asString(row.status, "posted");
  const status: LedgerRow["status"] =
    rawStatus === "pending" || rawStatus === "reversed" ? rawStatus : "posted";

  return {
    ledger_ref: ledgerRef,
    entry_type: asString(row.entry_type, "ledger_entry"),
    beneficiary:
      asString(row.beneficiary) ||
      asString(row.user_email) ||
      asString(row.user_id, "Unknown User"),
    account_id: asString(row.account_id, "—"),
    trader_user_id: asString(row.user_id) || asString(row.trader_user_id, "UNKNOWN"),
    l1_ib_id: asString(row.l1_ib_id) || null,
    l2_ib_id: asString(row.l2_ib_id) || null,
    relationship_snapshot_id: asString(row.relationship_snapshot_id) || null,
    related_rebate_record:
      asString(row.related_rebate_record) || asString(row.rebate_record_id) || null,
    amount: asNumber(row.amount),
    direction,
    status,
    created_at: asString(row.created_at, new Date().toISOString()),
  };
}

function mapWithdrawalRow(row: DbRow): WithdrawalRow | null {
  const withdrawalId = asString(row.withdrawal_id) || asString(row.id);

  if (!withdrawalId) {
    return null;
  }

  const rawStatus = asString(row.status, "pending");
  const status: WithdrawalRow["status"] =
    rawStatus === "approved" || rawStatus === "rejected" ? rawStatus : "pending";

  return {
    withdrawal_id: withdrawalId,
    beneficiary:
      asString(row.beneficiary) ||
      asString(row.user_email) ||
      asString(row.user_id, "Unknown User"),
    account_id: asString(row.account_id, "—"),
    trader_user_id: asString(row.user_id) || asString(row.trader_user_id, "UNKNOWN"),
    l1_ib_id: asString(row.l1_ib_id) || null,
    l2_ib_id: asString(row.l2_ib_id) || null,
    relationship_snapshot_id: asString(row.relationship_snapshot_id) || null,
    amount: asNumber(row.amount),
    fee: asNumber(row.fee),
    status,
    requested_at: asString(row.requested_at, new Date().toISOString()),
    wallet_address: asString(row.wallet_address, "—"),
    network: asString(row.network, "—"),
  };
}

export async function getAdminLedgerRows(): Promise<LedgerRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("finance_ledger")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return (data as DbRow[])
        .map(mapLedgerRow)
        .filter((row): row is LedgerRow => Boolean(row));
    }
  } catch {
    // Fall through to mock data.
  }

  return MOCK_LEDGER_ROWS;
}

export async function getAdminWithdrawalRows(): Promise<WithdrawalRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("withdrawals")
      .select("*")
      .order("requested_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return (data as DbRow[])
        .map(mapWithdrawalRow)
        .filter((row): row is WithdrawalRow => Boolean(row));
    }
  } catch {
    // Fall through to mock data.
  }

  return MOCK_WITHDRAWALS;
}

export async function getAdminAdjustmentRows(): Promise<AdjustmentRow[]> {
  return MOCK_ADJUSTMENTS;
}

export async function getAdminReconciliationRows(): Promise<ReconciliationRow[]> {
  return MOCK_RECONCILIATION_ROWS;
}

export async function getAdminFinanceHub(): Promise<FinanceHubData> {
  const [ledgerRows, withdrawals, adjustments, reconciliationRows] = await Promise.all([
    getAdminLedgerRows(),
    getAdminWithdrawalRows(),
    getAdminAdjustmentRows(),
    getAdminReconciliationRows(),
  ]);

  return {
    ...MOCK_FINANCE_HUB_DATA,
    ledgerRows,
    withdrawals,
    adjustments,
    reconciliationRows,
  };
}

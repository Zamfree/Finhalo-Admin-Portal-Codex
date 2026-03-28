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

function mapLedgerDirection(value: unknown, amount: number): LedgerRow["direction"] {
  const normalized = asString(value).trim().toLowerCase();

  if (normalized === "debit") {
    return "debit";
  }

  if (normalized === "credit") {
    return "credit";
  }

  return amount < 0 ? "debit" : "credit";
}

function mapLedgerStatus(value: unknown): LedgerRow["status"] {
  const normalized = asString(value).trim().toLowerCase();

  if (normalized === "pending" || normalized === "reversed") {
    return normalized;
  }

  return "posted";
}

function mapLedgerRow(row: DbRow): LedgerRow | null {
  const ledgerRef = asString(row.ledger_ref) || asString(row.id);

  if (!ledgerRef) {
    return null;
  }

  const signedAmount = asNumber(row.amount);
  const direction = mapLedgerDirection(row.direction, signedAmount);
  const amount = Math.abs(signedAmount);
  const status = mapLedgerStatus(row.status);

  return {
    ledger_ref: ledgerRef,
    entry_type: asString(row.entry_type) || asString(row.transaction_type, "ledger_entry"),
    beneficiary:
      asString(row.beneficiary) ||
      asString(row.user_email) ||
      asString(row.user_id, "Unknown User"),
    account_id: asString(row.account_id, "-"),
    trader_user_id: asString(row.user_id) || asString(row.trader_user_id, "UNKNOWN"),
    l1_ib_id: asString(row.l1_ib_id) || null,
    l2_ib_id: asString(row.l2_ib_id) || null,
    relationship_snapshot_id: asString(row.relationship_snapshot_id) || null,
    related_rebate_record:
      asString(row.related_rebate_record) || asString(row.rebate_record_id) || null,
    amount,
    direction,
    status,
    created_at: asString(row.created_at, new Date().toISOString()),
  };
}

function mapWithdrawalStatus(value: unknown): WithdrawalRow["status"] {
  const normalized = asString(value).trim().toLowerCase();

  if (normalized === "approved" || normalized === "rejected") {
    return normalized;
  }

  return "pending";
}

function mapWithdrawalRow(row: DbRow): WithdrawalRow | null {
  const withdrawalId = asString(row.withdrawal_id) || asString(row.id);

  if (!withdrawalId) {
    return null;
  }

  return {
    withdrawal_id: withdrawalId,
    beneficiary:
      asString(row.beneficiary) ||
      asString(row.user_email) ||
      asString(row.user_id, "Unknown User"),
    account_id: asString(row.account_id, "-"),
    trader_user_id: asString(row.user_id) || asString(row.trader_user_id, "UNKNOWN"),
    l1_ib_id: asString(row.l1_ib_id) || null,
    l2_ib_id: asString(row.l2_ib_id) || null,
    relationship_snapshot_id: asString(row.relationship_snapshot_id) || null,
    amount: Math.abs(asNumber(row.amount)),
    fee: Math.abs(asNumber(row.fee)),
    status: mapWithdrawalStatus(row.status),
    requested_at: asString(row.requested_at, new Date().toISOString()),
    wallet_address: asString(row.wallet_address, "-"),
    network: asString(row.network, "-"),
  };
}

function mapAdjustmentType(value: unknown, fallbackByAmount: number): "credit" | "debit" {
  const normalized = asString(value).trim().toLowerCase();

  if (normalized === "credit" || normalized === "debit") {
    return normalized;
  }

  return fallbackByAmount < 0 ? "debit" : "credit";
}

function mapAdjustmentRow(row: DbRow): AdjustmentRow | null {
  const adjustmentId = asString(row.adjustment_id) || asString(row.id);

  if (!adjustmentId) {
    return null;
  }

  const rawAmount = asNumber(row.amount);
  const adjustmentType = mapAdjustmentType(
    row.adjustment_type ?? row.direction ?? row.transaction_type,
    rawAmount
  );

  return {
    adjustment_id: adjustmentId,
    beneficiary:
      asString(row.beneficiary) ||
      asString(row.user_email) ||
      asString(row.user_id, "Unknown User"),
    account_id: asString(row.account_id, "-"),
    ledger_ref: asString(row.ledger_ref) || null,
    adjustment_type: adjustmentType,
    amount: Math.abs(rawAmount),
    reason: asString(row.reason, "Manual adjustment"),
    operator: asString(row.operator, "Admin Operator"),
    created_at: asString(row.created_at, new Date().toISOString()),
  };
}

function mapLedgerRowToAdjustment(row: LedgerRow): AdjustmentRow | null {
  if (!row.entry_type.toLowerCase().includes("adjust")) {
    return null;
  }

  return {
    adjustment_id: `ADJ-${row.ledger_ref}`,
    beneficiary: row.beneficiary,
    account_id: row.account_id,
    ledger_ref: row.ledger_ref,
    adjustment_type: row.direction === "credit" ? "credit" : "debit",
    amount: row.amount,
    reason: `Derived from ledger entry ${row.ledger_ref}`,
    operator: "System",
    created_at: row.created_at,
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
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("adjustments")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      const rows = (data as DbRow[])
        .map(mapAdjustmentRow)
        .filter((row): row is AdjustmentRow => Boolean(row));

      if (rows.length > 0) {
        return rows;
      }
    }
  } catch {
    // Fall through to ledger-derived adjustments.
  }

  const ledgerRows = await getAdminLedgerRows();
  const ledgerDerivedRows = ledgerRows
    .map(mapLedgerRowToAdjustment)
    .filter((row): row is AdjustmentRow => Boolean(row));

  if (ledgerDerivedRows.length > 0) {
    return ledgerDerivedRows;
  }

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

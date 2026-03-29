import type {
  AdjustmentRow,
  FinanceOperationalStage,
  FinanceSummaryMetric,
  FinanceHubData,
  LedgerFilters,
  LedgerRow,
  ReconciliationRow,
  WithdrawalFilters,
  WithdrawalRow,
} from "./_types";
import { formatTruncatedNumber } from "@/lib/money-display";

function getLedgerSignedAmount(row: LedgerRow) {
  return row.signed_amount ?? (row.direction === "credit" ? row.amount : -row.amount);
}

function isOpenWithdrawalStatus(status: WithdrawalRow["status"]) {
  return (
    status === "requested" ||
    status === "under_review" ||
    status === "approved" ||
    status === "processing"
  );
}

export function getFinanceHubMetrics(data: FinanceHubData): FinanceSummaryMetric[] {
  return [
    {
      key: "totalLedgerAmount",
      value: data.ledgerRows.reduce((sum, row) => sum + getLedgerSignedAmount(row), 0),
    },
    {
      key: "pendingWithdrawals",
      value: data.withdrawals.filter((row) => isOpenWithdrawalStatus(row.status)).length,
    },
    {
      key: "adjustmentsThisMonth",
      value: data.adjustments.reduce(
        (sum, row) => sum + (row.adjustment_type === "credit" ? row.amount : -row.amount),
        0
      ),
    },
    {
      key: "reconciliationAlerts",
      value: data.reconciliationRows.filter((row) => row.status === "alert").length,
    },
  ];
}

export function getFinanceOperationalStages(data: FinanceHubData): FinanceOperationalStage[] {
  const ledgerNet = data.ledgerRows.reduce(
    (sum, row) => sum + getLedgerSignedAmount(row),
    0
  );
  const pendingWithdrawals = data.withdrawals.filter((row) => isOpenWithdrawalStatus(row.status)).length;
  const adjustmentEntries = data.adjustments.length;
  const reconciliationAlerts = data.reconciliationRows.filter((row) => row.status !== "matched").length;

  return [
    {
      key: "ledger",
      label: "Ledger First",
      description: "Use the ledger as the source of truth for finance posture and downstream balance visibility.",
      metricLabel: "Net Ledger Position",
      metricValue: formatTruncatedNumber(ledgerNet),
      href: "/admin/finance/ledger",
    },
    {
      key: "withdrawals",
      label: "Withdrawal Review",
      description: "Keep pending payouts inside a guarded approval queue before funds move downstream.",
      metricLabel: "Pending Requests",
      metricValue: pendingWithdrawals.toLocaleString(),
      href: "/admin/finance/withdrawals",
    },
    {
      key: "adjustments",
      label: "Adjustment Control",
      description: "Track manual credits and debits as explicit operator actions rather than hidden balance edits.",
      metricLabel: "Adjustment Entries",
      metricValue: adjustmentEntries.toLocaleString(),
      href: "/admin/finance/adjustments",
    },
    {
      key: "reconciliation",
      label: "Reconciliation Loop",
      description: "Review broker-to-ledger differences before they propagate into final finance reporting.",
      metricLabel: "Items Requiring Review",
      metricValue: reconciliationAlerts.toLocaleString(),
      href: "/admin/finance/reconciliation",
    },
  ];
}

export function getLedgerSummaryMetrics(rows: LedgerRow[]): FinanceSummaryMetric[] {
  return [
    {
      key: "totalLedgerAmount",
      value: rows.reduce((sum, row) => sum + getLedgerSignedAmount(row), 0),
    },
    { key: "postedEntries", value: rows.filter((row) => row.status === "posted").length },
    { key: "pendingEntries", value: rows.filter((row) => row.status === "pending").length },
    { key: "reversedEntries", value: rows.filter((row) => row.status === "reversed").length },
  ];
}

export function filterLedgerRows(
  rows: LedgerRow[],
  filters: LedgerFilters,
  deepLinks?: {
    ledgerRefFilter?: string;
    rebateRecordIdFilter?: string;
    accountIdFilter?: string;
  }
) {
  if (deepLinks?.ledgerRefFilter) {
    return rows.filter((row) => row.ledger_ref === deepLinks.ledgerRefFilter);
  }

  if (deepLinks?.rebateRecordIdFilter) {
    return rows.filter((row) => row.related_rebate_record === deepLinks.rebateRecordIdFilter);
  }

  if (deepLinks?.accountIdFilter) {
    return rows.filter((row) => row.account_id === deepLinks.accountIdFilter);
  }

  const query = filters.query.trim().toLowerCase();

  return rows.filter((row) => {
    const matchesQuery =
      !query ||
      row.ledger_ref.toLowerCase().includes(query) ||
      row.beneficiary.toLowerCase().includes(query) ||
      row.account_id.toLowerCase().includes(query) ||
      row.related_rebate_record?.toLowerCase().includes(query);

    const matchesStatus = filters.status === "all" || row.status === filters.status;
    return matchesQuery && matchesStatus;
  });
}

export function getWithdrawalSummaryMetrics(rows: WithdrawalRow[]): FinanceSummaryMetric[] {
  return [
    { key: "pendingWithdrawals", value: rows.filter((row) => isOpenWithdrawalStatus(row.status)).length },
    {
      key: "approvalVolume",
      value: rows
        .filter((row) => isOpenWithdrawalStatus(row.status))
        .reduce((sum, row) => sum + row.request_amount, 0),
    },
    { key: "gasFees", value: rows.reduce((sum, row) => sum + row.fee_amount, 0) },
    { key: "rejected", value: rows.filter((row) => row.status === "rejected").length },
  ];
}

export function filterWithdrawalRows(
  rows: WithdrawalRow[],
  filters: WithdrawalFilters
) {
  const query = filters.query.trim().toLowerCase();
  const dateFrom = filters.date_from ? new Date(`${filters.date_from}T00:00:00`).getTime() : null;
  const dateTo = filters.date_to ? new Date(`${filters.date_to}T23:59:59.999`).getTime() : null;

  return rows.filter((row) => {
    const requestedAt = new Date(row.requested_at).getTime();
    const matchesQuery =
      !query ||
      row.withdrawal_id.toLowerCase().includes(query) ||
      row.beneficiary.toLowerCase().includes(query) ||
      row.account_id.toLowerCase().includes(query) ||
      row.wallet_address.toLowerCase().includes(query) ||
      row.destination.toLowerCase().includes(query);

    const matchesStatus = filters.status === "all" || row.status === filters.status;
    const matchesUser = !filters.user_id || row.user_id.toLowerCase().includes(filters.user_id.toLowerCase());
    const matchesAccount =
      !filters.account_id || row.account_id.toLowerCase().includes(filters.account_id.toLowerCase());
    const matchesCurrency =
      !filters.currency || row.currency.toLowerCase().includes(filters.currency.toLowerCase());
    const matchesPayoutMethod =
      !filters.payout_method ||
      row.payout_method.toLowerCase().includes(filters.payout_method.toLowerCase());
    const matchesDateFrom = dateFrom === null || requestedAt >= dateFrom;
    const matchesDateTo = dateTo === null || requestedAt <= dateTo;

    return (
      matchesQuery &&
      matchesStatus &&
      matchesUser &&
      matchesAccount &&
      matchesCurrency &&
      matchesPayoutMethod &&
      matchesDateFrom &&
      matchesDateTo
    );
  });
}

export function getAdjustmentSummaryMetrics(rows: AdjustmentRow[]): FinanceSummaryMetric[] {
  return [
    {
      key: "adjustmentsThisMonth",
      value: rows.reduce(
        (sum, row) => sum + (row.adjustment_type === "credit" ? row.amount : -row.amount),
        0
      ),
    },
    { key: "entries", value: rows.length },
    { key: "credits", value: rows.filter((row) => row.adjustment_type === "credit").length },
    { key: "debits", value: rows.filter((row) => row.adjustment_type === "debit").length },
  ];
}

export function getReconciliationSummaryMetrics(rows: ReconciliationRow[]): FinanceSummaryMetric[] {
  return [
    { key: "reconciliationAlerts", value: rows.filter((row) => row.status === "alert").length },
    { key: "reviewItems", value: rows.filter((row) => row.status === "review").length },
    { key: "matched", value: rows.filter((row) => row.status === "matched").length },
    { key: "netDifference", value: rows.reduce((sum, row) => sum + row.difference, 0) },
  ];
}

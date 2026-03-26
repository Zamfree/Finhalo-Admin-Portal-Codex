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

export function getFinanceHubMetrics(data: FinanceHubData): FinanceSummaryMetric[] {
  return [
    {
      key: "totalLedgerAmount",
      value: data.ledgerRows.reduce(
        (sum, row) => sum + (row.direction === "credit" ? row.amount : -row.amount),
        0
      ),
    },
    {
      key: "pendingWithdrawals",
      value: data.withdrawals.filter((row) => row.status === "pending").length,
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
    (sum, row) => sum + (row.direction === "credit" ? row.amount : -row.amount),
    0
  );
  const pendingWithdrawals = data.withdrawals.filter((row) => row.status === "pending").length;
  const adjustmentEntries = data.adjustments.length;
  const reconciliationAlerts = data.reconciliationRows.filter((row) => row.status !== "matched").length;

  return [
    {
      key: "ledger",
      label: "Ledger First",
      description: "Use the ledger as the source of truth for finance posture and downstream balance visibility.",
      metricLabel: "Net Ledger Position",
      metricValue: ledgerNet.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
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
      value: rows.reduce(
        (sum, row) => sum + (row.direction === "credit" ? row.amount : -row.amount),
        0
      ),
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
    { key: "pendingWithdrawals", value: rows.filter((row) => row.status === "pending").length },
    {
      key: "approvalVolume",
      value: rows.filter((row) => row.status === "pending").reduce((sum, row) => sum + row.amount, 0),
    },
    { key: "gasFees", value: rows.reduce((sum, row) => sum + row.fee, 0) },
    { key: "rejected", value: rows.filter((row) => row.status === "rejected").length },
  ];
}

export function filterWithdrawalRows(
  rows: WithdrawalRow[],
  filters: WithdrawalFilters,
  deepLinks?: { accountIdFilter?: string }
) {
  if (deepLinks?.accountIdFilter) {
    return rows.filter((row) => row.account_id === deepLinks.accountIdFilter);
  }

  const query = filters.query.trim().toLowerCase();

  return rows.filter((row) => {
    const matchesQuery =
      !query ||
      row.withdrawal_id.toLowerCase().includes(query) ||
      row.beneficiary.toLowerCase().includes(query) ||
      row.account_id.toLowerCase().includes(query) ||
      row.wallet_address.toLowerCase().includes(query);

    const matchesStatus = filters.status === "all" || row.status === filters.status;
    return matchesQuery && matchesStatus;
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

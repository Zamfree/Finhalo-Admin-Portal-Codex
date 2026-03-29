"use client";

import { useEffect } from "react";
import { AdminButton } from "@/components/system/actions/admin-button";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import { useAdminFilters } from "@/hooks/use-admin-filters";
import { useDrawerQueryState } from "@/hooks/use-drawer-query-state";
import { LEDGER_DRAWER_QUERY_CONFIG } from "../_config";
import { LEDGER_DEFAULT_FILTERS, LEDGER_DRAWER_TABS } from "../_constants";
import { LedgerFilterBar } from "./ledger-filter-bar";
import { LedgerDrawer } from "./drawer/ledger-drawer";
import { formatAmount } from "../_shared";
import type { LedgerRow, LedgerViewerFilters, LedgerViewerPagination } from "../_types";

function getTransactionTypeLabel(transactionType: LedgerRow["transaction_type"]) {
  if (transactionType === "rebate_settlement") return "Rebate Settlement";
  if (transactionType === "withdrawal_request") return "Withdrawal Request";
  if (transactionType === "manual_adjustment") return "Manual Adjustment";
  if (transactionType === "reversal") return "Reversal";
  return "Other";
}

function getTransactionTypeClass(transactionType: LedgerRow["transaction_type"]) {
  if (transactionType === "rebate_settlement") return "bg-cyan-500/10 text-cyan-300";
  if (transactionType === "withdrawal_request") return "bg-amber-500/10 text-amber-300";
  if (transactionType === "manual_adjustment") return "bg-sky-500/10 text-sky-300";
  if (transactionType === "reversal") return "bg-rose-500/10 text-rose-300";
  return "bg-zinc-500/10 text-zinc-300";
}

function getStatusClass(status: LedgerRow["status"]) {
  if (status === "posted") return "bg-emerald-500/10 text-emerald-300";
  if (status === "pending") return "bg-amber-500/10 text-amber-300";
  return "bg-rose-500/10 text-rose-300";
}

function getDirectionClass(direction: LedgerRow["direction"]) {
  return direction === "credit" ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300";
}

function getSignedAmountClass(value: number) {
  return value >= 0 ? "text-emerald-300" : "text-rose-300";
}

function formatTimestamp(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return value;
  }

  return new Date(parsed).toLocaleString();
}

function getLedgerColumns(): DataTableColumn<LedgerRow>[] {
  return [
    {
      key: "created_at",
      header: "Timestamp",
      cell: (row) => formatTimestamp(row.created_at),
      cellClassName: "py-3 pr-4 text-sm text-zinc-300",
      width: "180px",
    },
    {
      key: "user",
      header: "User",
      cell: (row) => (
        <div className="space-y-1">
          <p className="line-clamp-1 text-sm font-medium text-white">
            {row.user_display ?? row.beneficiary}
          </p>
          <p className="line-clamp-1 font-mono text-xs text-zinc-500">{row.user_id ?? "-"}</p>
        </div>
      ),
      cellClassName: "py-3 pr-4",
      width: "220px",
    },
    {
      key: "account_id",
      header: "Account",
      cell: (row) => row.account_id,
      cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-400",
      width: "140px",
    },
    {
      key: "transaction_type",
      header: "Transaction",
      cell: (row) => (
        <div className="space-y-1">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${getTransactionTypeClass(
              row.transaction_type
            )}`}
          >
            {getTransactionTypeLabel(row.transaction_type)}
          </span>
          <p className="line-clamp-1 text-xs text-zinc-500">{row.source_summary}</p>
        </div>
      ),
      cellClassName: "py-3 pr-4",
      width: "220px",
    },
    {
      key: "direction",
      header: "Direction",
      cell: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${getDirectionClass(
            row.direction
          )}`}
        >
          {row.direction}
        </span>
      ),
      cellClassName: "py-3 pr-4",
      width: "120px",
    },
    {
      key: "signed_amount",
      header: "Signed Amount",
      cell: (row) => (
        <div className="text-right">
          <p className={`font-semibold tabular-nums ${getSignedAmountClass(row.signed_amount)}`}>
            {formatAmount(Math.abs(row.signed_amount), row.signed_amount >= 0 ? "positive" : "negative")}
          </p>
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">
            {row.currency ?? "-"}
          </p>
        </div>
      ),
      headerClassName:
        "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName: "py-3 pr-4 text-right",
      width: "140px",
    },
    {
      key: "balance_after",
      header: "Balance After",
      cell: (row) => (
        <span className="font-mono tabular-nums text-zinc-300">
          {row.balance_after === null || row.balance_after === undefined
            ? "-"
            : formatAmount(Math.abs(row.balance_after), row.balance_after >= 0 ? "positive" : "negative")}
        </span>
      ),
      headerClassName:
        "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName: "py-3 pr-4 text-right",
      width: "140px",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${getStatusClass(
            row.status
          )}`}
        >
          {row.status}
        </span>
      ),
      cellClassName: "py-3 pr-4",
      width: "110px",
    },
    {
      key: "reference",
      header: "Reference",
      cell: (row) => (
        <div className="space-y-1">
          <p className="line-clamp-1 text-xs uppercase tracking-[0.12em] text-zinc-400">
            {row.reference_type ?? "-"}
          </p>
          <p className="line-clamp-1 font-mono text-xs text-zinc-500">{row.reference_id ?? "-"}</p>
        </div>
      ),
      cellClassName: "py-3 pr-4",
      width: "200px",
    },
    {
      key: "source",
      header: "Source Linkage",
      cell: (row) => (
        <div className="space-y-1">
          <p className="line-clamp-1 font-mono text-xs text-zinc-400">
            batch: {row.source_batch_id ?? "-"}
          </p>
          <p className="line-clamp-1 font-mono text-xs text-zinc-500">
            rebate: {row.related_rebate_record ?? "-"}
          </p>
          <p className="line-clamp-1 font-mono text-xs text-zinc-500">
            withdrawal: {row.related_withdrawal_id ?? "-"}
          </p>
        </div>
      ),
      cellClassName: "py-3 pr-4",
      width: "220px",
    },
    {
      key: "memo",
      header: "Memo",
      cell: (row) => (
        <p className="line-clamp-2 text-sm text-zinc-400">{row.memo ?? row.description ?? "-"}</p>
      ),
      cellClassName: "py-3 pr-0",
      width: "220px",
    },
  ];
}

type LedgerPageClientProps = {
  rows: LedgerRow[];
  pagination: LedgerViewerPagination;
  ledgerRefFilter?: string;
  rebateRecordIdFilter?: string;
  accountIdFilter?: string;
};

export function LedgerPageClient({
  rows,
  pagination,
  ledgerRefFilter,
  rebateRecordIdFilter,
  accountIdFilter,
}: LedgerPageClientProps) {
  const filters = useAdminFilters<LedgerViewerFilters>({
    defaultFilters: LEDGER_DEFAULT_FILTERS,
  });

  const drawerState = useDrawerQueryState({
    detailKey: LEDGER_DRAWER_QUERY_CONFIG.detailKey,
    tabKey: LEDGER_DRAWER_QUERY_CONFIG.tabKey,
    items: rows,
    getItemId: (item) => item.ledger_ref,
    defaultTab: "overview",
    validTabs: LEDGER_DRAWER_TABS,
  });

  useEffect(() => {
    if (rows.length === 1 && !drawerState.isOpen) {
      drawerState.openDrawer(rows[0]);
    }
  }, [rows, drawerState]);

  return (
    <div className="space-y-4">
      <LedgerFilterBar
        inputFilters={filters.inputFilters}
        setInputFilter={filters.setInputFilter}
        applyFilters={filters.applyFilters}
        clearFilters={filters.clearFilters}
      />

      {ledgerRefFilter || rebateRecordIdFilter ? (
        <p className="text-sm text-zinc-400">
          Filtered from Commission context
          {ledgerRefFilter ? ` by ledger ref ${ledgerRefFilter}` : ""}
          {rebateRecordIdFilter ? ` by rebate record ${rebateRecordIdFilter}` : ""}.
        </p>
      ) : accountIdFilter ? (
        <p className="text-sm text-zinc-400">Filtered by Account: {accountIdFilter}.</p>
      ) : (
        <p className="text-sm text-zinc-500">
          Ledger references are read-only and traceable to commission, withdrawal, and adjustment sources.
        </p>
      )}

      <DataTable
        columns={getLedgerColumns()}
        rows={rows}
        getRowKey={(row) => row.ledger_ref}
        getRowAriaLabel={(row) => `Open ledger entry ${row.ledger_ref}`}
        minWidthClassName="min-w-[1840px]"
        onRowClick={(row) => drawerState.openDrawer(row)}
        emptyMessage="No ledger entries found."
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-zinc-400">
          Showing {pagination.visibleFrom}-{pagination.visibleTo} of {pagination.totalCount} ledger entries
        </p>

        <div className="flex items-center gap-2">
          <AdminButton
            variant="ghost"
            onClick={() => filters.setCurrentPage(Math.max(1, pagination.page - 1))}
            disabled={!pagination.hasPreviousPage}
          >
            Previous
          </AdminButton>

          <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
            Page {pagination.page} / {pagination.totalPages}
          </span>

          <AdminButton
            variant="ghost"
            onClick={() =>
              filters.setCurrentPage(Math.min(pagination.totalPages, pagination.page + 1))
            }
            disabled={!pagination.hasNextPage}
          >
            Next
          </AdminButton>
        </div>
      </div>

      <LedgerDrawer
        entry={drawerState.selectedItem}
        open={drawerState.isOpen}
        activeTab={drawerState.activeTab}
        onChangeTab={drawerState.changeTab}
        onClose={drawerState.closeDrawer}
        onOpenChange={(open) => {
          if (!open) drawerState.closeDrawer();
        }}
      />
    </div>
  );
}

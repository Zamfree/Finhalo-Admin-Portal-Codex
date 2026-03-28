"use client";

import { useEffect, useMemo } from "react";
import { useAdminFilters } from "@/hooks/use-admin-filters";
import { useDrawerQueryState } from "@/hooks/use-drawer-query-state";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import { LEDGER_DRAWER_QUERY_CONFIG } from "../_config";
import { LEDGER_DEFAULT_FILTERS, LEDGER_DRAWER_TABS } from "../_constants";
import { LedgerFilterBar } from "./ledger-filter-bar";
import { LedgerDrawer } from "./drawer/ledger-drawer";
import { filterLedgerRows } from "../_mappers";
import { formatAmount } from "../_shared";
import type { LedgerFilters, LedgerRow } from "../_types";

function getStatusClass(status: LedgerRow["status"]) {
  if (status === "posted") return "bg-emerald-500/10 text-emerald-300";
  if (status === "pending") return "bg-amber-500/10 text-amber-300";
  return "bg-rose-500/10 text-rose-300";
}

function getLedgerColumns(): DataTableColumn<LedgerRow>[] {
  return [
    {
      key: "ledger_ref",
      header: "Ledger Ref",
      cell: (row) => row.ledger_ref,
      cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-300",
    },
    {
      key: "entry_type",
      header: "Entry Type",
      cell: (row) => (
        <span className="text-xs uppercase tracking-[0.12em] text-zinc-300">{row.entry_type}</span>
      ),
      cellClassName: "py-3 pr-4",
    },
    {
      key: "beneficiary",
      header: "Beneficiary",
      cell: (row) => <span className="block truncate font-medium text-white">{row.beneficiary}</span>,
      cellClassName: "py-3 pr-4",
    },
    {
      key: "account_id",
      header: "Account ID",
      cell: (row) => row.account_id,
      cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-400",
    },
    {
      key: "related_rebate_record",
      header: "Related Rebate Record",
      cell: (row) => row.related_rebate_record ?? "-",
      cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-400",
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) =>
        formatAmount(row.amount, row.direction === "credit" ? "positive" : "negative"),
      headerClassName:
        "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName: "py-3 pr-4 text-right tabular-nums text-white",
    },
    {
      key: "direction",
      header: "Direction",
      cell: (row) => (
        <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">{row.direction}</span>
      ),
      cellClassName: "py-3 pr-4",
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
    },
    {
      key: "created_at",
      header: "Created At",
      cell: (row) => new Date(row.created_at).toLocaleString(),
      cellClassName: "py-3 pr-0 text-sm text-zinc-400",
    },
  ];
}

type LedgerPageClientProps = {
  rows: LedgerRow[];
  ledgerRefFilter?: string;
  rebateRecordIdFilter?: string;
  accountIdFilter?: string;
};

export function LedgerPageClient({
  rows,
  ledgerRefFilter,
  rebateRecordIdFilter,
  accountIdFilter,
}: LedgerPageClientProps) {
  const filters = useAdminFilters<LedgerFilters>({
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

  const filteredRows = useMemo(
    () =>
      filterLedgerRows(rows, filters.appliedFilters, {
        ledgerRefFilter,
        rebateRecordIdFilter,
        accountIdFilter,
      }),
    [rows, filters.appliedFilters, ledgerRefFilter, rebateRecordIdFilter, accountIdFilter]
  );

  useEffect(() => {
    if (filteredRows.length === 1 && !drawerState.isOpen) {
      drawerState.openDrawer(filteredRows[0]);
    }
  }, [filteredRows, drawerState]);

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
          Posted, pending, and reversed describe finance record state only.
        </p>
      )}

      <DataTable
        columns={getLedgerColumns()}
        rows={filteredRows}
        getRowKey={(row) => row.ledger_ref}
        getRowAriaLabel={(row) => `Open ledger entry ${row.ledger_ref}`}
        minWidthClassName="min-w-[1120px]"
        onRowClick={(row) => drawerState.openDrawer(row)}
        emptyMessage="No ledger entries found."
      />

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

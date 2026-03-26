"use client";

import { useAdminFilters } from "@/hooks/use-admin-filters";
import { useDrawerQueryState } from "@/hooks/use-drawer-query-state";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import { StatusBadge } from "@/components/system/feedback/status-badge";
import { WITHDRAWAL_DRAWER_QUERY_CONFIG } from "../_config";
import { WITHDRAWAL_DEFAULT_FILTERS, WITHDRAWAL_DRAWER_TABS } from "../_constants";
import { filterWithdrawalRows } from "../_mappers";
import { formatAmount } from "../_shared";
import { WithdrawalsFilterBar } from "./withdrawals-filter-bar";
import { WithdrawalDrawer } from "./drawer/withdrawal-drawer";
import type { WithdrawalFilters, WithdrawalRow } from "../_types";

function getStatusClass(status: WithdrawalRow["status"]) {
  if (status === "pending") return "bg-amber-500/10 text-amber-300";
  if (status === "approved") return "bg-emerald-500/10 text-emerald-300";
  return "bg-rose-500/10 text-rose-300";
}

function getWithdrawalColumns(): DataTableColumn<WithdrawalRow>[] {
  return [
    {
      key: "withdrawal_id",
      header: "Withdrawal ID",
      cell: (row) => row.withdrawal_id,
      cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-300",
    },
    {
      key: "beneficiary",
      header: "User / Beneficiary",
      cell: (row) => (
        <span className="block truncate font-medium text-white">{row.beneficiary}</span>
      ),
      cellClassName: "py-3 pr-4",
    },
    {
      key: "account_id",
      header: "Account ID",
      cell: (row) => row.account_id,
      cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-400",
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => formatAmount(row.amount, "neutral"),
      headerClassName: "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName: "py-3 pr-4 text-right tabular-nums text-white",
    },
    {
      key: "fee",
      header: "Fee (Gas Fee)",
      cell: (row) => formatAmount(row.fee, "negative"),
      headerClassName: "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName: "py-3 pr-4 text-right tabular-nums text-zinc-300",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge size="default" toneClassName={getStatusClass(row.status)}>
          {row.status}
        </StatusBadge>
      ),
      cellClassName: "py-3 pr-4",
    },
    {
      key: "requested_at",
      header: "Requested At",
      cell: (row) => new Date(row.requested_at).toLocaleString(),
      cellClassName: "py-3 pr-4 text-sm text-zinc-400",
    },
  ];
}

export function WithdrawalsPageClient({
  rows,
  accountIdFilter,
}: {
  rows: WithdrawalRow[];
  accountIdFilter?: string;
}) {
  const filters = useAdminFilters<WithdrawalFilters>({
    defaultFilters: WITHDRAWAL_DEFAULT_FILTERS,
  });

  const drawerState = useDrawerQueryState({
    detailKey: WITHDRAWAL_DRAWER_QUERY_CONFIG.detailKey,
    tabKey: WITHDRAWAL_DRAWER_QUERY_CONFIG.tabKey,
    items: rows,
    getItemId: (item) => item.withdrawal_id,
    defaultTab: "overview",
    validTabs: WITHDRAWAL_DRAWER_TABS,
  });

  const filteredRows = filterWithdrawalRows(rows, filters.appliedFilters, { accountIdFilter });

  return (
    <div className="space-y-4">
      <WithdrawalsFilterBar
        inputFilters={filters.inputFilters}
        setInputFilter={filters.setInputFilter}
        applyFilters={filters.applyFilters}
        clearFilters={filters.clearFilters}
      />

      {accountIdFilter ? (
        <p className="text-sm text-zinc-400">Filtered by Account: {accountIdFilter}.</p>
      ) : null}

      <DataTable
        columns={getWithdrawalColumns()}
        rows={filteredRows}
        getRowKey={(row) => row.withdrawal_id}
        getRowAriaLabel={(row) => `Open withdrawal ${row.withdrawal_id}`}
        minWidthClassName="min-w-[1080px]"
        onRowClick={(row) => drawerState.openDrawer(row)}
        emptyMessage="No withdrawal requests found."
      />

      <WithdrawalDrawer
        withdrawal={drawerState.selectedItem}
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

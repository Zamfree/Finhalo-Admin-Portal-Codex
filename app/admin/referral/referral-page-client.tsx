"use client";

import { useMemo } from "react";

import { useAdminFilters } from "@/hooks/use-admin-filters";
import { useDrawerQueryState } from "@/hooks/use-drawer-query-state";
import { useTableQueryState } from "@/hooks/use-table-query-state";
import type { DataTableColumn } from "@/components/system/data/data-table";
import { DataTable } from "@/components/system/data/data-table";

import { REFERRAL_DRAWER_QUERY_CONFIG } from "./_config";
import { REFERRAL_DEFAULT_FILTERS, REFERRAL_DRAWER_TABS } from "./_constants";
import { ReferralDrawer } from "./drawer/referral-drawer";
import { ReferralFilterBar } from "./referral-filter-bar";
import type { ReferralRecord } from "./_types";

export function ReferralPageClient({ rows }: { rows: ReferralRecord[] }) {
  const tableState = useTableQueryState({
    filters: REFERRAL_DEFAULT_FILTERS,
  });
  const filters = useAdminFilters(tableState);
  const drawerState = useDrawerQueryState({
    detailKey: REFERRAL_DRAWER_QUERY_CONFIG.detailKey,
    tabKey: REFERRAL_DRAWER_QUERY_CONFIG.tabKey,
    items: rows,
    getItemId: (item) => item.referral_id,
    defaultTab: "overview",
    validTabs: REFERRAL_DRAWER_TABS,
  });

  const columns = useMemo<DataTableColumn<ReferralRecord>[]>(() => {
    return [
      {
        key: "name",
        header: "Program",
        cell: (row) => (
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">{row.name}</p>
            <p className="font-mono text-xs text-zinc-500">{row.referral_id}</p>
          </div>
        ),
        cellClassName: "py-3 pr-4",
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <span className="text-sm text-zinc-300">{row.status}</span>,
        cellClassName: "py-3 pr-4",
      },
      {
        key: "reward_model",
        header: "Reward Model",
        cell: (row) => row.reward_model,
        cellClassName: "py-3 pr-4 text-sm text-zinc-300",
      },
      {
        key: "participants",
        header: "Participants",
        cell: (row) => row.participants,
        cellClassName: "py-3 pr-4 text-sm tabular-nums text-white",
      },
      {
        key: "start_end",
        header: "Start / End",
        cell: (row) => (
          <div className="space-y-1 text-sm text-zinc-400">
            <p>{new Date(row.start_at).toLocaleDateString()}</p>
            <p>{new Date(row.end_at).toLocaleDateString()}</p>
          </div>
        ),
        cellClassName: "py-3 pr-0",
      },
    ];
  }, []);

  const filteredRows = useMemo(() => {
    const normalizedQuery = filters.appliedFilters.query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        row.name.toLowerCase().includes(normalizedQuery) ||
        row.referral_id.toLowerCase().includes(normalizedQuery) ||
        row.reward_model.toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        filters.appliedFilters.status === "all" || row.status === filters.appliedFilters.status;

      return matchesQuery && matchesStatus;
    });
  }, [rows, filters.appliedFilters]);

  return (
    <div className="space-y-4">
      <ReferralFilterBar
        inputFilters={filters.inputFilters}
        setInputFilter={filters.setInputFilter}
        applyFilters={filters.applyFilters}
        clearFilters={filters.clearFilters}
      />

      <DataTable
        columns={columns}
        rows={filteredRows}
        getRowKey={(row) => row.referral_id}
        minWidthClassName="min-w-[980px]"
        emptyMessage="No referral programs match the current search and filters."
        onRowClick={(row) => drawerState.openDrawer(row)}
      />

      <ReferralDrawer
        referral={drawerState.selectedItem}
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

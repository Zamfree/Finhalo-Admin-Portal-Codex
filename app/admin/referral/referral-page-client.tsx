"use client";

import { useMemo } from "react";

import { referralColumns } from "./_shared";
import { useAdminFilters } from "@/hooks/use-admin-filters";
import { useDrawerQueryState } from "@/hooks/use-drawer-query-state";
import { DataTable } from "@/components/system/data/data-table";
import { REFERRAL_DRAWER_QUERY_CONFIG } from "./_config";
import { REFERRAL_DEFAULT_FILTERS, REFERRAL_DRAWER_TABS } from "./_constants";
import { ReferralDrawer } from "./drawer/referral-drawer";
import { ReferralFilterBar } from "./referral-filter-bar";
import type { ReferralFilters, ReferralRecord } from "./_types";
import { filterReferralRows } from "./_mappers";

export function ReferralPageClient({ rows }: { rows: ReferralRecord[] }) {
  const filters = useAdminFilters<ReferralFilters>({
    defaultFilters: REFERRAL_DEFAULT_FILTERS,
  });

  const drawerState = useDrawerQueryState({
    detailKey: REFERRAL_DRAWER_QUERY_CONFIG.detailKey,
    tabKey: REFERRAL_DRAWER_QUERY_CONFIG.tabKey,
    items: rows,
    getItemId: (item) => item.referral_id,
    defaultTab: "overview",
    validTabs: REFERRAL_DRAWER_TABS,
  });

  const filteredRows = useMemo(
    () => filterReferralRows(rows, filters.appliedFilters),
    [rows, filters.appliedFilters]
  );

  return (
    <div className="space-y-4">
      <ReferralFilterBar
        inputFilters={filters.inputFilters}
        setInputFilter={filters.setInputFilter}
        applyFilters={filters.applyFilters}
        clearFilters={filters.clearFilters}
      />

      <DataTable
        columns={referralColumns}
        rows={filteredRows}
        getRowKey={(row) => row.referral_id}
        getRowAriaLabel={(row) => `Open referral program ${row.name}`}
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

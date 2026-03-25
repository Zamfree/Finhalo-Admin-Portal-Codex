"use client";

import { useMemo } from "react";

import { useAdminFilters } from "@/hooks/use-admin-filters";
import { useDrawerQueryState } from "@/hooks/use-drawer-query-state";
import { useTableQueryState } from "@/hooks/use-table-query-state";
import { DataTable } from "@/components/system/data/data-table";

import { USER_DRAWER_QUERY_CONFIG } from "./_config";
import { USER_DRAWER_TABS, USERS_DEFAULT_FILTERS } from "./_constants";
import { getAccountsForUser, MOCK_USER_ACTIVITY_SUMMARY } from "./_mock-data";
import { userColumns } from "./_shared";
import { UserDrawer } from "./drawer/user-drawer";
import { UsersFilterBar } from "./users-filter-bar";
import type { UserRow } from "@/types/user";

type Props = {
  rows: UserRow[];
};

export function UsersPageClient({ rows }: Props) {
  const tableState = useTableQueryState({
    filters: USERS_DEFAULT_FILTERS,
  });
  const filters = useAdminFilters(tableState);

  const drawerState = useDrawerQueryState({
    detailKey: USER_DRAWER_QUERY_CONFIG.detailKey,
    tabKey: USER_DRAWER_QUERY_CONFIG.tabKey,
    items: rows,
    getItemId: (item) => item.user_id,
    defaultTab: "overview",
    validTabs: USER_DRAWER_TABS,
  });

  const filteredRows = useMemo(() => {
    const normalizedQuery = filters.appliedFilters.query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        row.user_id.toLowerCase().includes(normalizedQuery) ||
        row.display_name.toLowerCase().includes(normalizedQuery) ||
        row.email.toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        filters.appliedFilters.status === "all" || row.status === filters.appliedFilters.status;

      return matchesQuery && matchesStatus;
    });
  }, [rows, filters.appliedFilters]);

  const ownedAccounts = useMemo(
    () => (drawerState.selectedItem ? getAccountsForUser(drawerState.selectedItem.user_id) : []),
    [drawerState.selectedItem]
  );

  const activitySummary = drawerState.selectedItem
    ? MOCK_USER_ACTIVITY_SUMMARY[drawerState.selectedItem.user_id] ?? {
        commission_summary: "No downstream commission activity yet",
        finance_summary: "No downstream finance activity yet",
        rebate_summary: "No downstream rebate activity yet",
      }
    : null;

  return (
    <div className="space-y-4">
      <UsersFilterBar
        inputFilters={filters.inputFilters}
        setInputFilter={filters.setInputFilter}
        applyFilters={filters.applyFilters}
        clearFilters={filters.clearFilters}
      />

      <DataTable
        columns={userColumns}
        rows={filteredRows}
        getRowKey={(row) => row.user_id}
        minWidthClassName="min-w-[1080px]"
        emptyMessage="No users found."
        onRowClick={(row) => drawerState.openDrawer(row)}
      />

      <UserDrawer
        user={drawerState.selectedItem}
        open={drawerState.isOpen}
        activeTab={drawerState.activeTab}
        onChangeTab={drawerState.changeTab}
        onClose={drawerState.closeDrawer}
        onOpenChange={(open) => {
          if (!open) drawerState.closeDrawer();
        }}
        ownedAccounts={ownedAccounts}
        activity={activitySummary}
      />
    </div>
  );
}

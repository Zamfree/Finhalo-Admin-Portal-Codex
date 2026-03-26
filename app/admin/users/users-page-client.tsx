"use client";

import { useMemo } from "react";
import { useAdminFilters } from "@/hooks/use-admin-filters";
import { useDrawerQueryState } from "@/hooks/use-drawer-query-state";
import { DataTable } from "@/components/system/data/data-table";
import { USER_DRAWER_QUERY_CONFIG } from "./_config";
import { USER_DRAWER_TABS, USERS_DEFAULT_FILTERS } from "./_constants";
import { getUserColumns } from "./_shared";
import { UserDrawer } from "./drawer/user-drawer";
import { UsersFilterBar } from "./users-filter-bar";
import type { UserActivitySummary, UserFilters, UserRow } from "./_types";
import type { TradingAccountRecord } from "../accounts/_types";
import { filterUserRows } from "./_mappers";

type Props = {
  rows: UserRow[];
  ownedAccountsByUser: Record<string, TradingAccountRecord[]>;
  activityByUser: Record<string, UserActivitySummary>;
};

export function UsersPageClient({ rows, ownedAccountsByUser, activityByUser }: Props) {
  const columns = useMemo(() => getUserColumns(ownedAccountsByUser), [ownedAccountsByUser]);

  const filters = useAdminFilters<UserFilters>({
    defaultFilters: USERS_DEFAULT_FILTERS,
  });

  const drawerState = useDrawerQueryState({
    detailKey: USER_DRAWER_QUERY_CONFIG.detailKey,
    tabKey: USER_DRAWER_QUERY_CONFIG.tabKey,
    items: rows,
    getItemId: (item) => item.user_id,
    defaultTab: "overview",
    validTabs: USER_DRAWER_TABS,
  });

  const filteredRows = useMemo(
    () => filterUserRows(rows, filters.appliedFilters),
    [rows, filters.appliedFilters]
  );

  const ownedAccounts = useMemo(
    () =>
      drawerState.selectedItem
        ? ownedAccountsByUser[drawerState.selectedItem.user_id] ?? []
        : [],
    [drawerState.selectedItem, ownedAccountsByUser]
  );

  const activitySummary = drawerState.selectedItem
    ? activityByUser[drawerState.selectedItem.user_id] ?? {
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
        columns={columns}
        rows={filteredRows}
        getRowKey={(row) => row.user_id}
        getRowAriaLabel={(row) => `Open user ${row.display_name}`}
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

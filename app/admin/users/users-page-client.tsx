"use client";

import { useMemo, useState } from "react";
import { AdminButton } from "@/components/system/actions/admin-button";
import { useAdminFilters } from "@/hooks/use-admin-filters";
import { useDrawerQueryState } from "@/hooks/use-drawer-query-state";
import { DataTable } from "@/components/system/data/data-table";
import { USER_DRAWER_QUERY_CONFIG } from "./_config";
import { USER_DRAWER_TABS, USERS_DEFAULT_FILTERS } from "./_constants";
import { getUserColumns } from "./_shared";
import { UserDrawer } from "./drawer/user-drawer";
import { UsersFilterBar } from "./users-filter-bar";
import { UserMutationDrawer } from "./user-mutation-drawer";
import type {
  UserActivitySummary,
  UserFilters,
  UserOperationalHistory,
  UserRow,
} from "./_types";
import type { TradingAccountRecord } from "../accounts/_types";
import { filterUserRows } from "./_mappers";

type Props = {
  rows: UserRow[];
  ownedAccountsByUser: Record<string, TradingAccountRecord[]>;
  activityByUser: Record<string, UserActivitySummary>;
  operationalHistoryByUser: Record<string, UserOperationalHistory>;
};

export function UsersPageClient({
  rows,
  ownedAccountsByUser,
  activityByUser,
  operationalHistoryByUser,
}: Props) {
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
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
    () => filterUserRows(rows, filters.appliedFilters, ownedAccountsByUser),
    [rows, filters.appliedFilters, ownedAccountsByUser]
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
  const operationalHistory = drawerState.selectedItem
    ? operationalHistoryByUser[drawerState.selectedItem.user_id] ?? null
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <AdminButton variant="primary" className="h-11 px-5" onClick={() => setIsCreateDrawerOpen(true)}>
          Create User
        </AdminButton>
      </div>

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
        onEdit={() => {
          if (!drawerState.selectedItem) {
            return;
          }

          setEditingUser(drawerState.selectedItem);
          setIsEditDrawerOpen(true);
          drawerState.closeDrawer();
        }}
        onClose={drawerState.closeDrawer}
        onOpenChange={(open) => {
          if (!open) drawerState.closeDrawer();
        }}
        ownedAccounts={ownedAccounts}
        userId={drawerState.selectedItem?.user_id ?? null}
        activity={activitySummary}
        operationalHistory={operationalHistory}
      />

      <UserMutationDrawer
        mode="create"
        open={isCreateDrawerOpen}
        onOpenChange={setIsCreateDrawerOpen}
      />

      <UserMutationDrawer
        mode="edit"
        user={editingUser}
        open={isEditDrawerOpen}
        onOpenChange={(open) => {
          setIsEditDrawerOpen(open);

          if (!open) {
            setEditingUser(null);
          }
        }}
      />
    </div>
  );
}

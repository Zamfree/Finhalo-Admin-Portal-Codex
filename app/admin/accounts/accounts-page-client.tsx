"use client";

import { useMemo } from "react";
import { useAdminPreferences } from "@/components/system/layout/admin-preferences-provider";
import { DataTable } from "@/components/system/data/data-table";
import { useAdminFilters } from "@/hooks/use-admin-filters";
import { useDrawerQueryState } from "@/hooks/use-drawer-query-state";
import { filterAccountRows } from "./_mappers";
import { ACCOUNT_DRAWER_QUERY_CONFIG } from "./_config";
import { ACCOUNT_DRAWER_TABS, ACCOUNTS_DEFAULT_FILTERS } from "./_constants";
import type {
  AccountFilters,
  TradingAccountRecord,
  TradingAccountRelatedActivity,
} from "./_types";
import { AccountsFilterBar } from "./accounts-filter-bar";
import { AccountDrawer } from "./drawer/account-drawer";
import { getAccountColumns } from "./_shared";

export function AccountsPageClient({
  rows,
  activityByAccountId,
}: {
  rows: TradingAccountRecord[];
  activityByAccountId: Record<string, TradingAccountRelatedActivity>;
}) {
  const { t } = useAdminPreferences();
  const brokers = useMemo(
    () => ["all", ...Array.from(new Set(rows.map((row) => row.broker)))],
    [rows]
  );

  const columns = useMemo(() => getAccountColumns(t), [t]);

  const filters = useAdminFilters<AccountFilters>({
    defaultFilters: ACCOUNTS_DEFAULT_FILTERS,
  });

  const filteredRows = useMemo(
    () => filterAccountRows(rows, filters.appliedFilters),
    [rows, filters.appliedFilters]
  );

  const drawerState = useDrawerQueryState({
    detailKey: ACCOUNT_DRAWER_QUERY_CONFIG.detailKey,
    tabKey: ACCOUNT_DRAWER_QUERY_CONFIG.tabKey,
    defaultTab: "overview",
    validTabs: ACCOUNT_DRAWER_TABS,
    items: rows,
    getItemId: (item) => item.account_id,
  });

  return (
    <div className="space-y-4">
      <AccountsFilterBar
        inputFilters={filters.inputFilters}
        brokerOptions={brokers.map((option) => ({
          value: option,
          label: option === "all" ? t("common.filters.allBrokers") : option,
        }))}
        setInputFilter={filters.setInputFilter}
        applyFilters={filters.applyFilters}
        clearFilters={filters.clearFilters}
        t={t}
      />

      <DataTable
        columns={columns}
        rows={filteredRows}
        getRowKey={(row) => row.account_id}
        getRowAriaLabel={(row) => `Open trading account ${row.account_id}`}
        minWidthClassName="min-w-[1140px]"
        emptyMessage={t("account.noAccounts")}
        onRowClick={(row) => drawerState.openDrawer(row)}
      />

      <AccountDrawer
        account={drawerState.selectedItem}
        activity={
          drawerState.selectedItem
            ? activityByAccountId[drawerState.selectedItem.account_id] ?? null
            : null
        }
        open={drawerState.isOpen}
        activeTab={drawerState.activeTab}
        onChangeTab={drawerState.changeTab}
        onOpenChange={(open) => {
          if (!open) {
            drawerState.closeDrawer();
          }
        }}
        onClose={drawerState.closeDrawer}
        t={t}
      />
    </div>
  );
}

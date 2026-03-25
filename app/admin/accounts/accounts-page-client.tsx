"use client";

import { useMemo } from "react";
import { useAdminPreferences } from "@/components/system/layout/admin-preferences-provider";
import type { DataTableColumn } from "@/components/system/data/data-table";
import { DataTable } from "@/components/system/data/data-table";
import { useAdminFilters } from "@/hooks/use-admin-filters";
import { useDrawerQueryState } from "@/hooks/use-drawer-query-state";
import { useTableQueryState } from "@/hooks/use-table-query-state";

import { ACCOUNT_DRAWER_QUERY_CONFIG } from "./_config";
import { ACCOUNT_DRAWER_TABS, ACCOUNTS_DEFAULT_FILTERS } from "./_constants";
import { AccountsFilterBar } from "./accounts-filter-bar";
import { AccountDrawer } from "./drawer/account-drawer";
import type { TradingAccountRecord } from "./_types";

export function AccountsPageClient({ rows }: { rows: TradingAccountRecord[] }) {
  const { t } = useAdminPreferences();
  const brokers = useMemo(
    () => ["all", ...Array.from(new Set(rows.map((row) => row.broker)))],
    [rows]
  );

  const columns = useMemo<DataTableColumn<TradingAccountRecord>[]>(() => {
    function roleValue(value?: string | null) {
      return value ?? "—";
    }

    function getStatusClass(status: TradingAccountRecord["status"]) {
      if (status === "active") return "bg-emerald-500/10 text-emerald-300";
      if (status === "monitoring") return "bg-amber-500/10 text-amber-300";
      return "bg-rose-500/10 text-rose-300";
    }

    return [
      {
        key: "account_id",
        header: t("common.labels.accountId"),
        cell: (row) => (
          <div className="space-y-1">
            <p className="font-mono text-sm text-white">{row.account_id}</p>
            <p className="text-xs text-zinc-500">
              {t("common.labels.createdAt")} {new Date(row.created_at).toLocaleDateString()}
            </p>
          </div>
        ),
        cellClassName: "py-3 pr-4",
      },
      {
        key: "broker",
        header: `${t("common.labels.broker")} / ${t("account.accountType")}`,
        cell: (row) => (
          <div className="space-y-1">
            <p className="font-medium text-white">{row.broker}</p>
            <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">{row.account_type}</p>
          </div>
        ),
        cellClassName: "py-3 pr-4",
      },
      {
        key: "status",
        header: t("common.labels.status"),
        cell: (row) => (
          <div className="space-y-1">
            <span
              className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getStatusClass(
                row.status
              )}`}
            >
              {row.status}
            </span>
            <p className="text-xs text-zinc-500">{row.trader_display_name}</p>
          </div>
        ),
        cellClassName: "py-3 pr-4",
      },
      {
        key: "owner",
        header: t("account.owner"),
        cell: (row) => (
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">{row.user_display_name}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
              <span>{row.user_email}</span>
              <span className="font-mono">{row.user_id}</span>
            </div>
          </div>
        ),
        cellClassName: "py-3 pr-4",
      },
      {
        key: "relationship",
        header: t("account.relationshipSnapshot"),
        cell: (row) => (
          <div className="space-y-1">
            <p className="font-mono text-xs text-zinc-400">{row.relationship_snapshot_id}</p>
            <p className="text-xs text-zinc-500">
              {t("account.trader")}: {row.trader_display_name} {"->"} {t("account.l1Ib")}:{" "}
              {row.l1_ib_display_name ?? roleValue(row.l1_ib_id)} {"->"} {t("account.l2Ib")}:{" "}
              {row.l2_ib_display_name ?? roleValue(row.l2_ib_id)}
            </p>
          </div>
        ),
        cellClassName: "py-3 pr-4",
      },
    ];
  }, [t]);

  const tableState = useTableQueryState({
    filters: ACCOUNTS_DEFAULT_FILTERS,
  });
  const filters = useAdminFilters(tableState);

  const filteredRows = useMemo(() => {
    const normalizedQuery = filters.appliedFilters.query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        row.account_id.toLowerCase().includes(normalizedQuery) ||
        row.user_display_name.toLowerCase().includes(normalizedQuery) ||
        row.user_email.toLowerCase().includes(normalizedQuery) ||
        row.user_id.toLowerCase().includes(normalizedQuery) ||
        row.trader_display_name.toLowerCase().includes(normalizedQuery) ||
        row.trader_user_id.toLowerCase().includes(normalizedQuery) ||
        row.relationship_snapshot_id.toLowerCase().includes(normalizedQuery) ||
        row.l1_ib_display_name?.toLowerCase().includes(normalizedQuery) ||
        row.l1_ib_id?.toLowerCase().includes(normalizedQuery) ||
        row.l2_ib_display_name?.toLowerCase().includes(normalizedQuery) ||
        row.l2_ib_id?.toLowerCase().includes(normalizedQuery);
      const matchesBroker =
        filters.appliedFilters.broker === "all" || row.broker === filters.appliedFilters.broker;
      const matchesStatus =
        filters.appliedFilters.status === "all" || row.status === filters.appliedFilters.status;

      return matchesQuery && matchesBroker && matchesStatus;
    });
  }, [filters.appliedFilters, rows]);

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
        minWidthClassName="min-w-[1140px]"
        emptyMessage={t("account.noAccounts")}
        onRowClick={(row) => drawerState.openDrawer(row)}
      />

      <AccountDrawer
        account={drawerState.selectedItem}
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

"use client";

import { useMemo } from "react";
import { useAdminPreferences } from "@/components/system/layout/admin-preferences-provider";
import type { DataTableColumn } from "@/components/system/data/data-table";
import { DataTable } from "@/components/system/data/data-table";
import { useAdminFilters } from "@/hooks/use-admin-filters";
import { useDrawerQueryState } from "@/hooks/use-drawer-query-state";
import { CAMPAIGN_DRAWER_QUERY_CONFIG } from "./_config";
import type { CampaignFilters, CampaignRecord } from "./_types";
import { CAMPAIGN_DEFAULT_FILTERS, CAMPAIGN_DRAWER_TABS } from "./_constants";
import { CampaignsFilterBar } from "./campaigns-filter-bar";
import { CampaignDrawer } from "./drawer/campaign-drawer";

function getStatusClass(status: CampaignRecord["status"]) {
  if (status === "active") return "bg-emerald-500/10 text-emerald-300";
  if (status === "scheduled") return "bg-blue-500/10 text-blue-300";
  return "bg-zinc-500/10 text-zinc-300";
}

export function CampaignsPageClient({ rows }: { rows: CampaignRecord[] }) {
  const { t } = useAdminPreferences();

  const filters = useAdminFilters<CampaignFilters>({
    defaultFilters: CAMPAIGN_DEFAULT_FILTERS,
  });
  
  const drawerState = useDrawerQueryState({
    detailKey: CAMPAIGN_DRAWER_QUERY_CONFIG.detailKey,
    tabKey: CAMPAIGN_DRAWER_QUERY_CONFIG.tabKey,
    items: rows,
    getItemId: (item) => item.campaign_id,
    defaultTab: "overview",
    validTabs: CAMPAIGN_DRAWER_TABS,
  });

  const columns = useMemo<DataTableColumn<CampaignRecord>[]>(() => {
    return [
      {
        key: "name",
        header: t("campaign.campaignName"),
        cell: (row) => (
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">{row.name}</p>
            <p className="font-mono text-xs text-zinc-500">{row.campaign_id}</p>
          </div>
        ),
        cellClassName: "py-3 pr-4",
      },
      {
        key: "type",
        header: t("campaign.type"),
        cell: (row) => <span className="text-sm text-zinc-300">{t(`campaign.types.${row.type}`)}</span>,
        cellClassName: "py-3 pr-4",
      },
      {
        key: "status",
        header: t("common.labels.status"),
        cell: (row) => (
          <span
            className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getStatusClass(
              row.status
            )}`}
          >
            {t(`campaign.statuses.${row.status}`)}
          </span>
        ),
        cellClassName: "py-3 pr-4",
      },
      {
        key: "reward_type",
        header: t("campaign.rewardType"),
        cell: (row) => row.reward_type,
        cellClassName: "py-3 pr-4 text-sm text-zinc-300",
      },
      {
        key: "participants",
        header: t("campaign.participants"),
        cell: (row) => row.participants,
        cellClassName: "py-3 pr-4 text-sm tabular-nums text-white",
      },
      {
        key: "start_end",
        header: t("campaign.startEnd"),
        cell: (row) => (
          <div className="space-y-1 text-sm text-zinc-400">
            <p>{new Date(row.start_at).toLocaleDateString()}</p>
            <p>{new Date(row.end_at).toLocaleDateString()}</p>
          </div>
        ),
        cellClassName: "py-3 pr-0",
      },
    ];
  }, [t]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = filters.appliedFilters.query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        row.name.toLowerCase().includes(normalizedQuery) ||
        row.campaign_id.toLowerCase().includes(normalizedQuery) ||
        row.reward_type.toLowerCase().includes(normalizedQuery) ||
        row.type.toLowerCase().includes(normalizedQuery) ||
        row.status.toLowerCase().includes(normalizedQuery);

      const matchesStatus =
        filters.appliedFilters.status === "all" || row.status === filters.appliedFilters.status;

      const matchesType =
        filters.appliedFilters.type === "all" || row.type === filters.appliedFilters.type;

      return matchesQuery && matchesStatus && matchesType;
    });
  }, [rows, filters.appliedFilters]);

  return (
    <div className="space-y-4">
      <CampaignsFilterBar
        inputFilters={filters.inputFilters}
        setInputFilter={filters.setInputFilter}
        applyFilters={filters.applyFilters}
        clearFilters={filters.clearFilters}
        searchPlaceholder={t("campaign.searchPlaceholder")}
      />

      <DataTable
        columns={columns}
        rows={filteredRows}
        getRowKey={(row) => row.campaign_id}
        getRowAriaLabel={(row) => `Open campaign ${row.name}`}
        minWidthClassName="min-w-[980px]"
        emptyMessage={t("campaign.noCampaigns")}
        onRowClick={(row) => drawerState.openDrawer(row)}
      />

      <CampaignDrawer
        campaign={drawerState.selectedItem}
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

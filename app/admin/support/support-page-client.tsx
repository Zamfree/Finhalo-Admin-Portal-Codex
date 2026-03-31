"use client";

import { useMemo } from "react";
import { useAdminPreferences } from "@/components/system/layout/admin-preferences-provider";
import { DataTable } from "@/components/system/data/data-table";
import { useAdminFilters } from "@/hooks/use-admin-filters";
import { useDrawerQueryState } from "@/hooks/use-drawer-query-state";
import { SUPPORT_DRAWER_QUERY_CONFIG } from "./_config";
import { SUPPORT_DEFAULT_FILTERS, SUPPORT_DRAWER_TABS } from "./_constants";
import { filterSupportTickets } from "./_mappers";
import { getSupportColumns } from "./_shared";
import { TicketDrawer } from "./drawer/ticket-drawer";
import { SupportFilterBar } from "./support-filter-bar";
import type { SupportFilters, SupportTicket, SupportTicketTimelineItem } from "./_types";

export function SupportPageClient({
  rows,
  timelineByTicket,
}: {
  rows: SupportTicket[];
  timelineByTicket: Record<string, SupportTicketTimelineItem[]>;
}) {
  const { t } = useAdminPreferences();

  const filters = useAdminFilters<SupportFilters>({
    defaultFilters: SUPPORT_DEFAULT_FILTERS,
  });

  const drawerState = useDrawerQueryState({
    detailKey: SUPPORT_DRAWER_QUERY_CONFIG.detailKey,
    tabKey: SUPPORT_DRAWER_QUERY_CONFIG.tabKey,
    items: rows,
    getItemId: (item) => item.ticket_id,
    defaultTab: "overview",
    validTabs: SUPPORT_DRAWER_TABS,
  });

  const filteredRows = useMemo(
    () => filterSupportTickets(rows, filters.appliedFilters),
    [rows, filters.appliedFilters]
  );

  const selectedTimeline = useMemo(
    () =>
      drawerState.selectedItem
        ? timelineByTicket[drawerState.selectedItem.ticket_id] ?? []
        : [],
    [drawerState.selectedItem, timelineByTicket]
  );

  return (
    <div className="space-y-4">
      <div className="admin-surface-soft rounded-2xl px-4 py-3 text-sm text-zinc-400">
        Support works as an investigation queue. Scan priority, requester, and linked entity
        context first, then open the drawer to review the case trail and hand off into the
        relevant operational module.
      </div>

      <SupportFilterBar
        inputFilters={filters.inputFilters}
        setInputFilter={filters.setInputFilter}
        applyFilters={filters.applyFilters}
        clearFilters={filters.clearFilters}
      />

      <DataTable
        columns={getSupportColumns(t)}
        rows={filteredRows}
        getRowKey={(row) => row.ticket_id}
        getRowAriaLabel={(row) => `Open support case ${row.ticket_id}`}
        minWidthClassName="min-w-[980px]"
        emptyMessage={t("support.noTickets")}
        onRowClick={(row) => drawerState.openDrawer(row)}
      />

      <TicketDrawer
        ticket={drawerState.selectedItem}
        timeline={selectedTimeline}
        open={drawerState.isOpen}
        activeTab={drawerState.activeTab}
        onChangeTab={drawerState.changeTab}
        onClose={drawerState.closeDrawer}
        onOpenChange={(open) => {
          if (!open) {
            drawerState.closeDrawer();
          }
        }}
        t={t}
      />
    </div>
  );
}

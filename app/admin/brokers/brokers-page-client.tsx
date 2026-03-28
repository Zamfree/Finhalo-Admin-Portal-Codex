"use client";

import { useMemo, useState } from "react";
import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { DataTable } from "@/components/system/data/data-table";
import { useAdminFilters } from "@/hooks/use-admin-filters";
import { useDrawerQueryState } from "@/hooks/use-drawer-query-state";
import { BROKER_DRAWER_QUERY_CONFIG } from "./_config";
import { BROKER_DEFAULT_FILTERS, BROKER_DRAWER_TABS, BROKERS_PAGE_SIZE } from "./_constants";
import { BrokersFilterBar } from "./brokers-filter-bar";
import { BrokerMutationDrawer } from "./broker-mutation-drawer";
import { BrokerDrawer } from "./drawer/broker-drawer";
import { filterBrokerRows, paginateBrokerRows } from "./_mappers";
import { getBrokerColumns } from "./_shared";
import type { BrokerFilters, BrokerListRow } from "./_types";

export function BrokersPageClient({ rows }: { rows: BrokerListRow[] }) {
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<BrokerListRow | null>(null);
  const filters = useAdminFilters<BrokerFilters>({
    defaultFilters: BROKER_DEFAULT_FILTERS,
  });

  const drawerState = useDrawerQueryState({
    detailKey: BROKER_DRAWER_QUERY_CONFIG.detailKey,
    tabKey: BROKER_DRAWER_QUERY_CONFIG.tabKey,
    items: rows,
    getItemId: (item) => item.broker_id,
    defaultTab: "overview",
    validTabs: BROKER_DRAWER_TABS,
  });

  const filteredRows = useMemo(
    () => filterBrokerRows(rows, filters.appliedFilters),
    [rows, filters.appliedFilters]
  );

  const paginated = useMemo(
    () => paginateBrokerRows(filteredRows, filters.currentPage, BROKERS_PAGE_SIZE),
    [filteredRows, filters.currentPage]
  );

  return (
    <>
      <DataPanel
        actions={
          <AdminButton
            variant="primary"
            className="h-11 px-5"
            onClick={() => setIsCreateDrawerOpen(true)}
          >
            Add Broker
          </AdminButton>
        }
        filters={
          <BrokersFilterBar
            inputFilters={filters.inputFilters}
            setInputFilter={filters.setInputFilter}
            applyFilters={filters.applyFilters}
            clearFilters={filters.clearFilters}
          />
        }
        footer={
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p>
              Showing {paginated.visibleFrom}-{paginated.visibleTo} of {paginated.total} brokers
            </p>

            <div className="flex items-center gap-2">
              <AdminButton
                variant="ghost"
                onClick={() => filters.setCurrentPage(Math.max(1, paginated.safeCurrentPage - 1))}
                disabled={paginated.safeCurrentPage === 1}
              >
                Previous
              </AdminButton>

              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                Page {paginated.safeCurrentPage} / {paginated.totalPages}
              </span>

              <AdminButton
                variant="ghost"
                onClick={() =>
                  filters.setCurrentPage(Math.min(paginated.totalPages, paginated.safeCurrentPage + 1))
                }
                disabled={paginated.safeCurrentPage === paginated.totalPages || paginated.total === 0}
              >
                Next
              </AdminButton>
            </div>
          </div>
        }
      >
        <DataTable
          columns={getBrokerColumns()}
          rows={paginated.paginatedRows}
          getRowKey={(row) => row.broker_id}
          getRowAriaLabel={(row) => `Open broker ${row.broker_name}`}
          minWidthClassName="min-w-[860px]"
          onRowClick={(row) => drawerState.openDrawer(row)}
          emptyMessage="No brokers found."
        />
      </DataPanel>

      <BrokerDrawer
        broker={drawerState.selectedItem}
        open={drawerState.isOpen}
        activeTab={drawerState.activeTab}
        onChangeTab={drawerState.changeTab}
        onEdit={() => {
          if (!drawerState.selectedItem) {
            return;
          }

          setEditingBroker(drawerState.selectedItem);
          setIsEditDrawerOpen(true);
          drawerState.closeDrawer();
        }}
        onClose={drawerState.closeDrawer}
        onOpenChange={(open) => {
          if (!open) {
            drawerState.closeDrawer();
          }
        }}
      />

      <BrokerMutationDrawer
        mode="create"
        open={isCreateDrawerOpen}
        onOpenChange={setIsCreateDrawerOpen}
      />

      <BrokerMutationDrawer
        mode="edit"
        broker={editingBroker}
        open={isEditDrawerOpen}
        onOpenChange={(open) => {
          setIsEditDrawerOpen(open);

          if (!open) {
            setEditingBroker(null);
          }
        }}
      />
    </>
  );
}

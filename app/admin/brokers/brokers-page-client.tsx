"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AdminButton } from "@/components/system/actions/admin-button";
import { AdminSelect } from "@/components/system/controls/admin-select";
import { DataPanel } from "@/components/system/data/data-panel";
import { FilterBar } from "@/components/system/data/filter-bar";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import { AppDrawer } from "@/components/system/drawer/app-drawer";
import {
  DrawerBody,
  DrawerDivider,
  DrawerFooter,
  DrawerHeader,
} from "@/components/system/drawer/drawer-section";
import { useTableQueryState } from "@/hooks/use-table-query-state";

export type BrokerListRow = {
  broker_id: string;
  broker_name: string;
  status: "active" | "inactive";
  accounts: number;
  created_at: string;
  commission_batches: number;
  latest_batch_id: string | null;
};

const PAGE_SIZE = 5;

function getStatusClass(status: BrokerListRow["status"]) {
  return status === "active"
    ? "bg-emerald-500/10 text-emerald-300"
    : "bg-zinc-500/10 text-zinc-300";
}

const columns: DataTableColumn<BrokerListRow>[] = [
  {
    key: "broker_id",
    header: "Broker ID",
    cell: (row) => row.broker_id,
    cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-400",
  },
  {
    key: "broker_name",
    header: "Broker Name",
    cell: (row) => row.broker_name,
    cellClassName: "py-3 pr-4 font-medium text-white",
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${getStatusClass(
          row.status
        )}`}
      >
        {row.status}
      </span>
    ),
    cellClassName: "py-3 pr-4",
  },
  {
    key: "accounts",
    header: "Accounts",
    cell: (row) => row.accounts,
    headerClassName:
      "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-4 text-right tabular-nums text-zinc-300",
  },
  {
    key: "created_at",
    header: "Created At",
    cell: (row) => new Date(row.created_at).toLocaleString(),
    cellClassName: "py-3 pr-0 text-sm text-zinc-400",
    headerClassName:
      "py-3 pr-0 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
  },
];

export function BrokersPageClient({ rows }: { rows: BrokerListRow[] }) {
  const {
    inputFilters,
    appliedFilters,
    currentPage,
    setCurrentPage,
    setInputFilter,
    applyFilters,
    clearFilters,
    updatePageInUrl,
  } = useTableQueryState({
    filters: {
      broker_query: "",
      status: "all",
    },
  });
  const [selectedBroker, setSelectedBroker] = useState<BrokerListRow | null>(null);

  const { broker_query: brokerQueryInput, status: statusInput } = inputFilters;
  const { broker_query: appliedBrokerQuery, status: appliedStatus } = appliedFilters;

  const filteredBrokers = useMemo(() => {
    const keyword = appliedBrokerQuery.trim().toLowerCase();

    return rows.filter((broker) => {
      const matchesBrokerQuery =
        !keyword ||
        broker.broker_name.toLowerCase().includes(keyword) ||
        broker.broker_id.toLowerCase().includes(keyword);

      const matchesStatus = appliedStatus === "all" || broker.status === appliedStatus;

      return matchesBrokerQuery && matchesStatus;
    });
  }, [appliedBrokerQuery, appliedStatus, rows]);

  const totalBrokers = filteredBrokers.length;
  const totalPages = Math.max(1, Math.ceil(totalBrokers / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedBrokers = filteredBrokers.slice(startIndex, endIndex);
  const visibleFrom = totalBrokers === 0 ? 0 : startIndex + 1;
  const visibleTo = Math.min(endIndex, totalBrokers);

  function handlePreviousPage() {
    const nextPage = Math.max(1, safeCurrentPage - 1);
    setCurrentPage(nextPage);
    updatePageInUrl(nextPage);
  }

  function handleNextPage() {
    const nextPage = Math.min(totalPages, safeCurrentPage + 1);
    setCurrentPage(nextPage);
    updatePageInUrl(nextPage);
  }

  return (
    <>
      <DataPanel
        actions={
          <AdminButton variant="primary" className="h-11 px-5">
            Add Broker
          </AdminButton>
        }
        filters={
          <FilterBar
            onApply={(event) => {
              event.preventDefault();
              applyFilters();
            }}
            onReset={clearFilters}
            search={
              <div>
                <label
                  htmlFor="broker_query"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
                >
                  Search
                </label>
                <input
                  id="broker_query"
                  name="broker_query"
                  value={brokerQueryInput}
                  onChange={(event) => setInputFilter("broker_query", event.target.value)}
                  placeholder="Search brokers by name or ID"
                  className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                />
              </div>
            }
            filters={
              <div className="sm:w-[200px]">
                <label
                  htmlFor="status"
                  className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
                >
                  Status
                </label>
                <AdminSelect
                  value={statusInput}
                  onValueChange={(value) => setInputFilter("status", value)}
                  options={[
                    { value: "all", label: "All" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />
              </div>
            }
          />
        }
        footer={
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p>
              Showing {visibleFrom}-{visibleTo} of {totalBrokers} brokers
            </p>

            <div className="flex items-center gap-2">
              <AdminButton
                variant="ghost"
                onClick={handlePreviousPage}
                disabled={safeCurrentPage === 1}
              >
                Previous
              </AdminButton>

              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                Page {safeCurrentPage} / {totalPages}
              </span>

              <AdminButton
                variant="ghost"
                onClick={handleNextPage}
                disabled={safeCurrentPage === totalPages || totalBrokers === 0}
              >
                Next
              </AdminButton>
            </div>
          </div>
        }
      >
        <DataTable
          columns={columns}
          rows={paginatedBrokers}
          getRowKey={(row) => row.broker_id}
          minWidthClassName="min-w-[860px]"
          onRowClick={(row) => setSelectedBroker(row)}
          emptyMessage="No brokers found."
        />
      </DataPanel>

      <AppDrawer
        open={Boolean(selectedBroker)}
        onOpenChange={(open) => {
          if (!open) setSelectedBroker(null);
        }}
        title={selectedBroker?.broker_name ?? "Broker Detail"}
        width="wide"
      >
        {selectedBroker ? (
          <>
            <DrawerHeader
              title={selectedBroker.broker_name}
              description={`${selectedBroker.broker_id} | broker operations`}
              onClose={() => setSelectedBroker(null)}
            />
            <DrawerDivider />
            <DrawerBody>
              <div className="grid gap-6 lg:grid-cols-2">
                <DataPanel title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Overview</h3>}>
                  <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Broker ID
                      </dt>
                      <dd className="font-mono text-sm text-zinc-300">{selectedBroker.broker_id}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Broker Name
                      </dt>
                      <dd className="text-sm font-medium text-white">{selectedBroker.broker_name}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Status
                      </dt>
                      <dd>
                        <span className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getStatusClass(selectedBroker.status)}`}>
                          {selectedBroker.status}
                        </span>
                      </dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Created At
                      </dt>
                      <dd className="text-sm text-zinc-300">
                        {new Date(selectedBroker.created_at).toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </DataPanel>

                <DataPanel title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Context / Relationship</h3>}>
                  <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Account Count
                      </dt>
                      <dd className="text-lg font-semibold text-white">{selectedBroker.accounts}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Operational Context
                      </dt>
                      <dd className="text-sm text-zinc-300">
                        {selectedBroker.status === "active" ? "Accepting active account flow." : "Inactive broker coverage."}
                      </dd>
                    </div>
                  </dl>
                </DataPanel>

                <DataPanel
                  title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Related Activity / References</h3>}
                  className="lg:col-span-2"
                >
                  <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Linked Accounts
                      </dt>
                      <dd className="text-lg font-semibold text-white">{selectedBroker.accounts}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Commission Batches
                      </dt>
                      <dd className="text-lg font-semibold text-white">{selectedBroker.commission_batches}</dd>
                    </div>
                    <div className="space-y-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        Latest Batch
                      </dt>
                      <dd className="font-mono text-sm text-zinc-300">{selectedBroker.latest_batch_id ?? "—"}</dd>
                    </div>
                  </dl>
                </DataPanel>
              </div>
            </DrawerBody>
            <DrawerDivider />
            <DrawerFooter>
              <p className="mr-auto text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Handoff
              </p>
              <Link href={`/admin/brokers/${selectedBroker.broker_id}`}>
                <AdminButton variant="ghost">Open Broker Page</AdminButton>
              </Link>
              <Link href="/admin/commission">
                <AdminButton variant="secondary">View Commission Center</AdminButton>
              </Link>
            </DrawerFooter>
          </>
        ) : null}
      </AppDrawer>
    </>
  );
}

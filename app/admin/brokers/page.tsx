"use client";

import { AdminSelect } from "@/components/system/controls/admin-select";
import { useMemo } from "react";
import { DataPanel } from "@/components/system/data/data-panel";
import { FilterBar } from "@/components/system/data/filter-bar";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import { useTableQueryState } from "@/hooks/use-table-query-state";

import type { BrokerRow } from "@/types/broker";

const MOCK_BROKERS: BrokerRow[] = [
  {
    broker_id: "BRK-1001",
    broker_name: "IC Markets",
    status: "active",
    accounts: 128,
    created_at: "2026-02-01T10:30:00Z",
  },
  {
    broker_id: "BRK-1002",
    broker_name: "Pepperstone",
    status: "active",
    accounts: 94,
    created_at: "2026-02-03T08:14:00Z",
  },
  {
    broker_id: "BRK-1003",
    broker_name: "XM",
    status: "inactive",
    accounts: 61,
    created_at: "2026-02-06T13:55:00Z",
  },
  {
    broker_id: "BRK-1004",
    broker_name: "Exness",
    status: "active",
    accounts: 142,
    created_at: "2026-02-12T11:45:00Z",
  },
  {
    broker_id: "BRK-1005",
    broker_name: "FXTM",
    status: "inactive",
    accounts: 37,
    created_at: "2026-02-15T09:41:00Z",
  },
  {
    broker_id: "BRK-1006",
    broker_name: "Axi",
    status: "active",
    accounts: 73,
    created_at: "2026-02-17T15:20:00Z",
  },
];

const PAGE_SIZE = 5;

function getStatusClass(status: BrokerRow["status"]) {
  return status === "active"
    ? "bg-emerald-500/10 text-emerald-300"
    : "bg-zinc-500/10 text-zinc-300";
}

export default function BrokersPage() {
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

  const {
    broker_query: brokerQueryInput,
    status: statusInput,
  } = inputFilters;

  const {
    broker_query: appliedBrokerQuery,
    status: appliedStatus,
  } = appliedFilters;

  const filteredBrokers = useMemo(() => {
    const keyword = appliedBrokerQuery.trim().toLowerCase();

    return MOCK_BROKERS.filter((broker) => {
      const matchesBrokerQuery =
        !keyword ||
        broker.broker_name.toLowerCase().includes(keyword) ||
        broker.broker_id.toLowerCase().includes(keyword);

      const matchesStatus =
        appliedStatus === "all" || broker.status === appliedStatus;

      return matchesBrokerQuery && matchesStatus;
    });
  }, [appliedBrokerQuery, appliedStatus]);

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

  const columns: DataTableColumn<BrokerRow>[] = [
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

  return (
    <div className="space-y-6 pb-8">
      <DataPanel
        title={
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Admin / Directory
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Brokers
            </h1>
          </div>
        }
        description={
          <p className="max-w-2xl text-sm leading-6 text-zinc-400">
            Manage broker partners and review current broker status.
          </p>
        }
        actions={
          <button
            type="button"
            className="h-11 rounded-xl bg-white/8 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-100 transition hover:bg-white/12"          >
            Add Broker
          </button>
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
              <button
                type="button"
                onClick={handlePreviousPage}
                disabled={safeCurrentPage === 1}
                className="rounded-lg bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"              >
                Previous
              </button>

              <span className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                Page {safeCurrentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={safeCurrentPage === totalPages || totalBrokers === 0}
                className="rounded-lg bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.12em] text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"              >
                Next
              </button>
            </div>
          </div>
        }
      >
        <DataTable
          columns={columns}
          rows={paginatedBrokers}
          getRowKey={(row) => row.broker_id}
          minWidthClassName="min-w-[860px]"
        />
      </DataPanel>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import { useAdminFilters } from "@/hooks/use-admin-filters";
import { useDrawerQueryState } from "@/hooks/use-drawer-query-state";

import { COMMISSION_DEFAULT_FILTERS } from "./_constants";
import { filterCommissionRecords } from "./_mappers";
import { formatAmount } from "./_shared";
import type { CommissionFilters, CommissionQueueWorkspace, CommissionRecord } from "./_types";
import { CommissionBatchesTableClient } from "./batches/batches-table-client";
import { BatchQueueDrawer } from "./batches/batch-queue-drawer";
import { CommissionFilterBar } from "./commission-filter-bar";

function escapeCsvCell(value: string | number) {
  const text = String(value);

  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function downloadCommissionRecordsCsv(rows: CommissionRecord[]) {
  if (rows.length === 0) {
    return;
  }

  const headers = [
    "commission_id",
    "batch_id",
    "trader_user_id",
    "trader_email",
    "account_id",
    "broker",
    "gross_commission",
    "rebate_amount",
    "platform_amount",
    "settled_at",
  ];
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.commission_id,
        row.batch_id,
        row.trader_user_id,
        row.trader_email,
        row.account_id,
        row.broker,
        row.gross_commission,
        row.rebate_amount,
        row.platform_amount,
        row.settled_at,
      ]
        .map(escapeCsvCell)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `commission-records-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function CommissionPageClient({
  queueWorkspace,
  commissionRecords,
}: {
  queueWorkspace: CommissionQueueWorkspace;
  commissionRecords: CommissionRecord[];
}) {
  const searchParams = useSearchParams();
  const [showAllBatches, setShowAllBatches] = useState(() => searchParams.get("show_all") === "1");
  const filters = useAdminFilters<CommissionFilters>({
    defaultFilters: COMMISSION_DEFAULT_FILTERS,
  });
  const attentionRows = useMemo(
    () => queueWorkspace.items.filter((item) => item.workflow.needsReview),
    [queueWorkspace.items]
  );
  const visibleRows = useMemo(
    () => (showAllBatches ? queueWorkspace.items : attentionRows),
    [showAllBatches, queueWorkspace.items, attentionRows]
  );
  const filteredRecords = useMemo(
    () => filterCommissionRecords(commissionRecords, filters.appliedFilters),
    [commissionRecords, filters.appliedFilters]
  );
  const brokerOptions = useMemo(
    () =>
      Array.from(new Set(commissionRecords.map((record) => record.broker.trim()).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [commissionRecords]
  );
  const recordColumns = useMemo<DataTableColumn<CommissionRecord>[]>(
    () => [
      {
        key: "commission_id",
        header: "Commission ID",
        cell: (row) => row.commission_id,
        cellClassName: "py-2 pr-4 font-mono text-sm text-zinc-300",
      },
      {
        key: "trader_user_id",
        header: "User",
        cell: (row) => row.trader_user_id,
        cellClassName: "py-2 pr-4 font-mono text-sm text-zinc-300",
      },
      {
        key: "trader_email",
        header: "Email",
        cell: (row) => row.trader_email,
        cellClassName: "py-2 pr-4 text-zinc-300",
      },
      {
        key: "account_id",
        header: "Account",
        cell: (row) => row.account_id,
        cellClassName: "py-2 pr-4 font-mono text-sm text-zinc-300",
      },
      {
        key: "broker",
        header: "Broker",
        cell: (row) => row.broker,
        cellClassName: "py-2 pr-4 text-zinc-300",
      },
      {
        key: "gross_commission",
        header: "Commission",
        cell: (row) => formatAmount(row.gross_commission, "neutral"),
        headerClassName:
          "py-2 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
        cellClassName: "py-2 pr-4 text-right tabular-nums text-white",
      },
      {
        key: "settled_at",
        header: "Date",
        cell: (row) => new Date(row.settled_at).toLocaleDateString(),
        cellClassName: "py-2 pr-0 text-zinc-400",
      },
    ],
    []
  );

  const drawerState = useDrawerQueryState({
    detailKey: "detail_batch_id",
    tabKey: "batch_drawer",
    defaultTab: "overview",
    validTabs: ["overview"] as const,
    items: queueWorkspace.items,
    getItemId: (item) => item.batch.batch_id,
  });

  return (
    <>
      <div
        className={`transition-[opacity,filter] duration-200 ease-out ${
          drawerState.isOpen ? "opacity-65 blur-[3px]" : "opacity-100 blur-0"
        }`}
      >
        <DataPanel
          title={<h2 className="text-xl font-semibold text-white">Needs Attention ({attentionRows.length})</h2>}
          actions={
            <AdminButton
              variant="ghost"
              className="h-10 px-4"
              onClick={() => setShowAllBatches((current) => !current)}
            >
              {showAllBatches ? "Show Attention Only" : "Show All Batches"}
            </AdminButton>
          }
        >
          <CommissionBatchesTableClient
            rows={visibleRows}
            onRowClick={(row) => drawerState.openDrawer(row)}
          />
        </DataPanel>

        <DataPanel
          title={
            <h2 className="text-xl font-semibold text-white">
              Commission Records ({filteredRecords.length})
            </h2>
          }
          description={
            <p className="text-sm text-zinc-400">
              Search by user, account, email, broker, and date range.
            </p>
          }
          actions={
            <AdminButton
              variant="ghost"
              className="h-10 px-4"
              disabled={filteredRecords.length === 0}
              onClick={() => downloadCommissionRecordsCsv(filteredRecords)}
            >
              Export CSV
            </AdminButton>
          }
        >
          <div className="space-y-4">
            <CommissionFilterBar
              inputFilters={filters.inputFilters}
              setInputFilter={filters.setInputFilter}
              applyFilters={filters.applyFilters}
              clearFilters={filters.clearFilters}
              searchPlaceholder="Search user/account/email/batch"
              clearLabel="Clear"
              brokerOptions={brokerOptions}
            />
            <DataTable
              columns={recordColumns}
              rows={filteredRecords}
              getRowKey={(row) => row.commission_id}
              minWidthClassName="min-w-[1200px]"
              rowClassName="text-zinc-200"
              emptyMessage="No commission records found."
            />
          </div>
        </DataPanel>
      </div>

      <BatchQueueDrawer
        item={drawerState.selectedItem}
        profitThresholdPercent={queueWorkspace.profitThresholdPercent}
        open={drawerState.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            drawerState.closeDrawer();
          }
        }}
        onClose={drawerState.closeDrawer}
      />
    </>
  );
}

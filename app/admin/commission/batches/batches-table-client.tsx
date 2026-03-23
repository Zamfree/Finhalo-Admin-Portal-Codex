"use client";

import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";

import { formatAmount } from "../_shared";
import type { CommissionBatch } from "../_types";
import { BatchWorkflowActions } from "./batch-workflow-actions";

function getStatusClass(status: CommissionBatch["status"]) {
  if (status === "confirmed" || status === "locked") return "bg-emerald-500/10 text-emerald-300";
  if (status === "validated") return "bg-blue-500/10 text-blue-300";
  if (status === "imported") return "bg-amber-500/10 text-amber-300";
  return "bg-rose-500/10 text-rose-300";
}

function getCheckClass(value: string) {
  if (value === "clear" || value === "passed") return "bg-emerald-500/10 text-emerald-300";
  if (value === "review") return "bg-amber-500/10 text-amber-300";
  return "bg-rose-500/10 text-rose-300";
}

function getWorkflowState(row: CommissionBatch) {
  const isLocked = row.status === "locked" || row.status === "confirmed";
  const needsReview =
    row.failed_rows > 0 || row.validation_result !== "passed" || row.duplicate_result !== "clear";
  const isReady = !isLocked && !needsReview && row.status === "validated";

  return { isLocked, needsReview, isReady };
}

const batchColumns: DataTableColumn<CommissionBatch>[] = [
  {
    key: "batch_id",
    header: "Batch ID",
    cell: (row) => row.batch_id,
    cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-300",
  },
  {
    key: "broker",
    header: "Broker",
    cell: (row) => <span className="font-medium text-white">{row.broker}</span>,
    cellClassName: "py-3 pr-4",
  },
  {
    key: "source_file",
    header: "Source File",
    cell: (row) => row.source_file,
    cellClassName: "py-3 pr-4 text-sm text-zinc-300",
  },
  {
    key: "imported_at",
    header: "Imported At",
    cell: (row) => new Date(row.imported_at).toLocaleString(),
    cellClassName: "py-3 pr-4 text-sm text-zinc-400",
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
    key: "total_commission",
    header: "Total Commission (Gross)",
    cell: (row) => formatAmount(row.total_commission, "neutral"),
    headerClassName:
      "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-4 text-right tabular-nums text-white",
  },
  {
    key: "success_rows",
    header: "Success Rows",
    cell: (row) => row.success_rows.toLocaleString(),
    headerClassName:
      "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-4 text-right tabular-nums text-white",
  },
  {
    key: "failed_rows",
    header: "Failed Rows",
    cell: (row) => row.failed_rows.toLocaleString(),
    headerClassName:
      "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-4 text-right tabular-nums text-zinc-300",
  },
  {
    key: "duplicate_result",
    header: "Duplicate Check",
    cell: (row) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${getCheckClass(
          row.duplicate_result
        )}`}
      >
        {row.duplicate_result}
      </span>
    ),
    cellClassName: "py-3 pr-4",
  },
  {
    key: "validation_result",
    header: "Validation Result",
    cell: (row) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${getCheckClass(
          row.validation_result
        )}`}
      >
        {row.validation_result}
      </span>
    ),
    cellClassName: "py-3 pr-4",
  },
  {
    key: "actions",
    header: "Workflow Actions",
    cell: (row) => {
      const { isLocked, needsReview, isReady } = getWorkflowState(row);

      return (
        <BatchWorkflowActions
          batchId={row.batch_id}
          isLocked={isLocked}
          isReady={isReady}
          needsReview={needsReview}
          showViewDetail
          align="right"
          buttonClassName="px-3 py-2"
          helperTextClassName="text-[11px]"
        />
      );
    },
    headerClassName:
      "py-2.5 pr-0 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-0",
  },
];

export function CommissionBatchesTableClient({ rows }: { rows: CommissionBatch[] }) {
  return (
    <DataTable
      columns={batchColumns}
      rows={rows}
      getRowKey={(row) => row.batch_id}
      minWidthClassName="min-w-[1280px]"
      emptyMessage="No commission batches found."
    />
  );
}

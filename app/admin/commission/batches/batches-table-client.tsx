"use client";

import { useMemo } from "react";

import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import { StatusBadge } from "@/components/system/feedback/status-badge";

import { formatAmount } from "../_shared";
import { sortCommissionBatchesForQueueWithContext } from "../_mappers";
import type { CommissionBatchQueueItem, CommissionDecisionTone } from "../_types";
import { BatchWorkflowActions } from "./batch-workflow-actions";

function getDecisionClass(tone: CommissionDecisionTone) {
  if (tone === "ready") return "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  if (tone === "review") return "border border-amber-500/20 bg-amber-500/10 text-amber-300";
  if (tone === "error") return "border border-rose-500/20 bg-rose-500/10 text-rose-300";
  return "border border-zinc-500/20 bg-zinc-500/10 text-zinc-300";
}

export function CommissionBatchesTableClient({
  rows,
  onRowClick,
}: {
  rows: CommissionBatchQueueItem[];
  onRowClick?: (row: CommissionBatchQueueItem) => void;
}) {
  const sortedRows = useMemo(() => {
    const rowByBatchId = new Map(rows.map((row) => [row.batch.batch_id, row]));

    return sortCommissionBatchesForQueueWithContext(
      rows.map((row) => row.batch),
      (batch) => ({
        guardrailBlocked: rowByBatchId.get(batch.batch_id)?.guardrailBlocked,
        simulationCompleted: rowByBatchId.get(batch.batch_id)?.simulationCompleted,
        simulationRequired: rowByBatchId.get(batch.batch_id)?.simulationRequired,
      })
    )
      .map((batch) => rowByBatchId.get(batch.batch_id))
      .filter((row): row is CommissionBatchQueueItem => Boolean(row));
  }, [rows]);

  const columns = useMemo<DataTableColumn<CommissionBatchQueueItem>[]>(() => [
    {
      key: "batch_id",
      header: "Batch ID",
      cell: (row) => row.batch.batch_id,
      cellClassName: "py-1.5 pr-4 font-mono text-sm text-zinc-300",
      width: "132px",
    },
    {
      key: "broker",
      header: "Broker",
      cell: (row) => <span className="font-medium text-white">{row.batch.broker}</span>,
      cellClassName: "py-1.5 pr-4",
      width: "160px",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => {
        const decision = row.decision;

        return (
          <StatusBadge size="default" toneClassName={getDecisionClass(decision.tone)}>
            {decision.label}
          </StatusBadge>
        );
      },
      cellClassName: "py-1.5 pr-4",
      width: "160px",
    },
    {
      key: "source_file",
      header: "Import File",
      cell: (row) => (
        <span className="line-clamp-1 max-w-[180px] text-sm text-zinc-300" title={row.batch.source_file}>
          {row.batch.source_file}
        </span>
      ),
      cellClassName: "py-1.5 pr-4",
      width: "200px",
    },
    {
      key: "batch_status",
      header: "Import Status",
      cell: (row) => <span className="font-mono text-xs uppercase text-zinc-400">{row.batch.status}</span>,
      cellClassName: "py-1.5 pr-4",
      width: "132px",
    },
    {
      key: "row_counts",
      header: "Rows (S/F/E)",
      cell: (row) => (
        <span className="font-mono text-xs text-zinc-300">
          {row.batch.success_rows}/{row.batch.failed_rows}/{row.batch.error_count}
        </span>
      ),
      cellClassName: "py-1.5 pr-4",
      width: "132px",
    },
    {
      key: "problem_summary",
      header: "Problem Summary",
      cell: (row) => <span className="text-sm text-zinc-300">{row.problemSummary}</span>,
      cellClassName: "py-1.5 pr-4",
      width: "168px",
    },
    {
      key: "total_commission",
      header: "Total Commission",
      cell: (row) => formatAmount(row.metrics?.grossCommission ?? row.batch.total_commission, "neutral"),
      headerClassName:
        "py-1.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName: "py-1.5 pr-4 text-right tabular-nums text-white",
      width: "144px",
    },
    {
      key: "actions",
      header: "Action",
      cell: (row) => (
        <BatchWorkflowActions
          batchId={row.batch.batch_id}
          isLocked={row.workflow.isSettled}
          isReady={row.workflow.isReadyForSettlement}
          needsReview={row.workflow.needsReview}
          guardrailBlocked={row.guardrailBlocked}
          simulationCompleted={row.simulationCompleted}
          simulationEligible={row.simulationEligible}
          mappingReviewPending={
            row.batch.mapping_status !== "mapped" || row.batch.validation_result !== "passed"
          }
          duplicateReviewPending={row.batch.duplicate_result !== "clear"}
          onOpen={() => onRowClick?.(row)}
          mode="queue"
        />
      ),
      headerClassName:
        "py-1.5 pr-0 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName: "py-1.5 pr-0 align-middle",
      width: "240px",
    },
  ], [onRowClick]);

  return (
    <DataTable
      columns={columns}
      rows={sortedRows}
      getRowKey={(row) => row.batch.batch_id}
      getRowAriaLabel={(row) => `Open commission batch ${row.batch.batch_id}`}
      minWidthClassName="min-w-[1400px]"
      rowClassName="group text-zinc-200 even:bg-white/[0.015] hover:bg-white/[0.03]"
      onRowClick={onRowClick}
      emptyMessage="No commission batches found."
    />
  );
}

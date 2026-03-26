"use client";

import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";

import { formatAmount } from "../../_shared";
import type { CommissionBatchSourceRow } from "../../_types";

export function BatchRecordsTableClient({ rows }: { rows: CommissionBatchSourceRow[] }) {
  const issueRows = rows.filter((row) => row.result !== "success" || Boolean(row.error));
  const visibleRows = issueRows.length > 0 ? issueRows : rows;

  const recordColumns: DataTableColumn<CommissionBatchSourceRow>[] = [
    {
      key: "account_number",
      header: "Account Number",
      cell: (record) => record.account_number,
      cellClassName: "py-2 pr-6 font-mono text-sm text-zinc-300",
    },
    {
      key: "symbol",
      header: "Symbol",
      cell: (record) => record.symbol,
      cellClassName: "py-2 pr-6 text-white",
    },
    {
      key: "volume",
      header: "Lot",
      cell: (record) => record.volume.toLocaleString(),
      cellClassName: "py-2 pr-6 text-zinc-300",
    },
    {
      key: "commission_amount",
      header: "Commission",
      cell: (record) => formatAmount(record.commission_amount, "neutral"),
      headerClassName:
        "py-2 pr-6 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName: "py-2 pr-6 text-right tabular-nums text-white",
    },
    {
      key: "commission_date",
      header: "Trade Date",
      cell: (record) =>
        record.commission_date === "—"
          ? "—"
          : new Date(record.commission_date).toLocaleDateString(),
      cellClassName: "py-2 pr-6 text-sm text-zinc-400",
    },
    {
      key: "issue",
      header: "Issue",
      cell: (record) => {
        const hasDuplicate = record.error?.toLowerCase().includes("duplicate");
        const toneClass = hasDuplicate
          ? "text-rose-300"
          : record.error
            ? "text-amber-300"
            : "text-zinc-500";

        return <span className={`text-sm ${toneClass}`}>{record.error ?? "Clear"}</span>;
      },
      cellClassName: "py-2 pr-0",
    },
  ];

  return (
    <DataTable
      columns={recordColumns}
      rows={visibleRows}
      getRowKey={(record) =>
        `${record.account_number}-${record.symbol}-${record.commission_date}-${record.commission_amount}`
      }
      minWidthClassName="min-w-[980px]"
      rowClassName={(record) => {
        const hasDuplicate = record.error?.toLowerCase().includes("duplicate");
        const hasWarning = Boolean(record.error) && !hasDuplicate;

        if (hasDuplicate) {
          return "text-zinc-200 shadow-[inset_4px_0_0_rgba(239,68,68,0.85)] bg-rose-500/[0.04]";
        }

        if (hasWarning) {
          return "text-zinc-200 shadow-[inset_4px_0_0_rgba(245,158,11,0.85)] bg-amber-500/[0.04]";
        }

        return "text-zinc-200";
      }}
      emptyMessage="No problem records found."
    />
  );
}

"use client";

import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";

export type RecentBatchRow = {
  batch_id: string;
  status: string;
  records: number;
  imported_at: string;
};

const recentBatchColumns: DataTableColumn<RecentBatchRow>[] = [
  {
    key: "batch_id",
    header: "Batch ID",
    cell: (row) => row.batch_id,
    cellClassName: "py-3 pr-6 font-mono text-sm text-zinc-400",
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => (
      <span className="text-xs uppercase tracking-[0.12em] text-zinc-300">
        {row.status}
      </span>
    ),
  },
  {
    key: "records",
    header: "Records",
    cell: (row) => row.records.toLocaleString(),
    headerClassName:
      "py-2.5 pr-6 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-6 text-right tabular-nums text-white",
  },
  {
    key: "imported_at",
    header: "Imported At",
    cell: (row) => new Date(row.imported_at).toLocaleString(),
    headerClassName:
      "py-2.5 pr-0 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-0 text-sm text-zinc-400",
  },
];

export function RecentBatchesTableClient({ rows }: { rows: RecentBatchRow[] }) {
  return (
    <DataTable
      columns={recentBatchColumns}
      rows={rows}
      getRowKey={(row) => row.batch_id}
      minWidthClassName="min-w-[700px]"
    />
  );
}

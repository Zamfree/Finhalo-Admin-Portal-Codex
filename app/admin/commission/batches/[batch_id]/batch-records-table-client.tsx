"use client";

import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";

import { formatAmount } from "../../_shared";
import type { CommissionBatchSourceRow } from "../../_types";

const recordColumns: DataTableColumn<CommissionBatchSourceRow>[] = [
  {
    key: "account_number",
    header: "Account Number",
    cell: (record) => record.account_number,
    cellClassName: "py-3 pr-6 font-mono text-sm text-zinc-300",
  },
  {
    key: "symbol",
    header: "Symbol",
    cell: (record) => record.symbol,
    cellClassName: "py-3 pr-6 text-white",
  },
  {
    key: "volume",
    header: "Lot",
    cell: (record) => record.volume.toLocaleString(),
    cellClassName: "py-3 pr-6 text-zinc-300",
  },
  {
    key: "commission_amount",
    header: "Commission",
    cell: (record) => formatAmount(record.commission_amount, "neutral"),
    headerClassName:
      "py-2.5 pr-6 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-6 text-right tabular-nums text-white",
  },
  {
    key: "commission_date",
    header: "Trade Date",
    cell: (record) => new Date(record.commission_date).toLocaleDateString(),
    cellClassName: "py-3 pr-6 text-sm text-zinc-400",
  },
  {
    key: "result",
    header: "Result",
    cell: (record) => (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${
          record.result === "success"
            ? "bg-emerald-500/10 text-emerald-300"
            : "bg-rose-500/10 text-rose-300"
        }`}
      >
        {record.result}
      </span>
    ),
    cellClassName: "py-3 pr-0",
  },
];

export function BatchRecordsTableClient({ rows }: { rows: CommissionBatchSourceRow[] }) {
  return (
    <DataTable
      columns={recordColumns}
      rows={rows}
      getRowKey={(record) =>
        `${record.account_number}-${record.symbol}-${record.commission_date}-${record.commission_amount}`
      }
      minWidthClassName="min-w-[980px]"
      emptyMessage="No source records found."
    />
  );
}

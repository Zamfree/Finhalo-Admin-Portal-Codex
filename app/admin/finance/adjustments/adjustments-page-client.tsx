"use client";

import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";

import { formatAmount } from "../_shared";
import type { AdjustmentRow } from "../_types";

const adjustmentColumns: DataTableColumn<AdjustmentRow>[] = [
  {
    key: "adjustment_id",
    header: "Adjustment ID",
    cell: (row) => row.adjustment_id,
    cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-300",
  },
  {
    key: "beneficiary",
    header: "Beneficiary",
    cell: (row) => <span className="block truncate font-medium text-white">{row.beneficiary}</span>,
    cellClassName: "py-3 pr-4",
  },
  {
    key: "account_id",
    header: "Account ID",
    cell: (row) => row.account_id,
    cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-400",
  },
  {
    key: "adjustment_type",
    header: "Adjustment Type",
    cell: (row) => (
      <span className="text-xs uppercase tracking-[0.12em] text-zinc-300">{row.adjustment_type}</span>
    ),
    cellClassName: "py-3 pr-4",
  },
  {
    key: "amount",
    header: "Amount",
    cell: (row) =>
      formatAmount(row.amount, row.adjustment_type === "credit" ? "positive" : "negative"),
    headerClassName:
      "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-4 text-right tabular-nums text-white",
  },
  {
    key: "reason",
    header: "Reason",
    cell: (row) => <span className="block break-words">{row.reason}</span>,
    cellClassName: "py-3 pr-4 text-sm text-zinc-300",
  },
  {
    key: "operator",
    header: "Operator",
    cell: (row) => row.operator,
    cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-400",
  },
  {
    key: "created_at",
    header: "Created At",
    cell: (row) => new Date(row.created_at).toLocaleString(),
    cellClassName: "py-3 pr-0 text-sm text-zinc-400",
  },
];

export function AdjustmentsPageClient({ rows }: { rows: AdjustmentRow[] }) {
  return (
    <DataTable
      columns={adjustmentColumns}
      rows={rows}
      getRowKey={(row) => row.adjustment_id}
      getRowAriaLabel={(row) => `Open adjustment ${row.adjustment_id}`}
      minWidthClassName="min-w-[1120px]"
      emptyMessage="No adjustments found."
    />
  );
}

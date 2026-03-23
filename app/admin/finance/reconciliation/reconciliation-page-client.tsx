"use client";

import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";

import { formatAmount } from "../_shared";

export type ReconciliationRow = {
  period: string;
  broker: string;
  input_commission_total: number;
  platform_total: number;
  rebate_total: number;
  ledger_total: number;
  paid_total: number;
  difference: number;
  status: "matched" | "review" | "alert";
};

function getStatusClass(status: ReconciliationRow["status"]) {
  if (status === "matched") return "bg-emerald-500/10 text-emerald-300";
  if (status === "review") return "bg-amber-500/10 text-amber-300";
  return "bg-rose-500/10 text-rose-300";
}

const reconciliationColumns: DataTableColumn<ReconciliationRow>[] = [
  {
    key: "period",
    header: "Period",
    cell: (row) => row.period,
    cellClassName: "py-3 pr-4 text-sm text-zinc-300",
  },
  {
    key: "broker",
    header: "Broker",
    cell: (row) => <span className="font-medium text-white">{row.broker}</span>,
    cellClassName: "py-3 pr-4",
  },
  {
    key: "input_commission_total",
    header: "Input Commission Total",
    cell: (row) => formatAmount(row.input_commission_total, "neutral"),
    headerClassName:
      "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-4 text-right tabular-nums text-white",
  },
  {
    key: "platform_total",
    header: "Platform Total",
    cell: (row) => formatAmount(row.platform_total, "neutral"),
    headerClassName:
      "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-4 text-right tabular-nums text-white",
  },
  {
    key: "rebate_total",
    header: "Rebate Total",
    cell: (row) => formatAmount(row.rebate_total, "neutral"),
    headerClassName:
      "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-4 text-right tabular-nums text-white",
  },
  {
    key: "ledger_total",
    header: "Ledger Total",
    cell: (row) => formatAmount(row.ledger_total, "neutral"),
    headerClassName:
      "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-4 text-right tabular-nums text-white",
  },
  {
    key: "paid_total",
    header: "Paid Total",
    cell: (row) => formatAmount(row.paid_total, "neutral"),
    headerClassName:
      "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-4 text-right tabular-nums text-white",
  },
  {
    key: "difference",
    header: "Difference",
    cell: (row) =>
      formatAmount(
        row.difference,
        row.difference > 0 ? "positive" : row.difference < 0 ? "negative" : "neutral"
      ),
    headerClassName:
      "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-4 text-right tabular-nums text-white",
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
    cellClassName: "py-3 pr-0",
  },
];

export function ReconciliationPageClient({ rows }: { rows: ReconciliationRow[] }) {
  return (
    <DataTable
      columns={reconciliationColumns}
      rows={rows}
      getRowKey={(row) => `${row.period}-${row.broker}`}
      minWidthClassName="min-w-[1320px]"
      emptyMessage="No reconciliation records found."
    />
  );
}

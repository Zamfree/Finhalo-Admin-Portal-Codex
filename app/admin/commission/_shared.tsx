import type { DataTableColumn } from "@/components/system/data/data-table";
import Link from "next/link";

import { getStatusBadgeClass } from "./_config";
import { AdminButton } from "@/components/system/actions/admin-button";
import type { CommissionPipelineStage, CommissionRecord, RebateRecord } from "./_types";

export { SummaryCard } from "@/components/system/cards/summary-card";

export function formatAmount(
  value: number,
  mode: "positive" | "negative" | "neutral" = "neutral"
) {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  if (mode === "positive") {
    return `+$${formatted}`;
  }

  if (mode === "negative") {
    return `-$${formatted}`;
  }

  return `$${formatted}`;
}

export function formatDateTime(value: string) {
  const date = new Date(value);

  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(
    date.getDate()
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

export function getBrokerInputColumns(): DataTableColumn<CommissionRecord>[] {
  return [
    {
      key: "commission_id",
      header: "Commission ID",
      sortable: true,
      sortAccessor: (row) => row.commission_id,
      cell: (row) => row.commission_id,
      cellClassName: "py-4 pr-4 font-mono text-sm text-zinc-300",
    },
    {
      key: "batch_id",
      header: "Batch",
      sortable: true,
      sortAccessor: (row) => row.batch_id,
      cell: (row) => row.batch_id,
      cellClassName: "py-4 pr-4 font-mono text-sm text-zinc-400",
    },
    {
      key: "broker",
      header: "Broker",
      sortable: true,
      sortAccessor: (row) => row.broker,
      cell: (row) => row.broker,
      cellClassName: "py-4 pr-4 text-zinc-300",
    },
    {
      key: "account_id",
      header: "Account ID",
      cell: (row) => row.account_id,
      cellClassName: "py-4 pr-4 font-mono text-sm text-zinc-400",
    },
    {
      key: "gross_commission",
      header: "Gross Commission",
      cell: (row) => formatAmount(row.gross_commission, "neutral"),
      headerClassName:
        "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName: "py-4 pr-4 text-right tabular-nums text-white",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${getStatusBadgeClass(
            row.status
          )}`}
        >
          {row.status}
        </span>
      ),
      cellClassName: "py-4 pr-4 align-middle",
    },
    {
      key: "imported_at",
      header: "Imported At",
      sortable: true,
      sortAccessor: (row) => new Date(row.imported_at).getTime(),
      cell: (row) => formatDateTime(row.imported_at),
      cellClassName: "py-4 pr-0 whitespace-nowrap text-sm text-zinc-400",
      headerClassName:
        "py-3 pr-0 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    },
  ];
}

export function getAllocationColumns(): DataTableColumn<CommissionRecord>[] {
  return [
    {
      key: "trader_email",
      header: "Trader Email",
      sortable: true,
      sortAccessor: (row) => row.trader_email,
      cell: (row) => <span className="font-medium text-white">{row.trader_email}</span>,
      cellClassName: "py-4 pr-4",
    },
    {
      key: "account_id",
      header: "Account ID",
      cell: (row) => row.account_id,
      cellClassName: "py-4 pr-4 font-mono text-sm text-zinc-400",
    },
    {
      key: "broker",
      header: "Broker",
      sortable: true,
      sortAccessor: (row) => row.broker,
      cell: (row) => row.broker,
      cellClassName: "py-4 pr-4 text-zinc-300",
    },
    {
      key: "rebate_type",
      header: "Rebate Type",
      sortable: true,
      sortAccessor: (row) => row.rebate_type,
      cell: (row) => (
        <span className="inline-flex rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-zinc-300">
          {row.rebate_type}
        </span>
      ),
      cellClassName: "py-4 pr-4 align-middle",
    },
    {
      key: "amount_breakdown",
      header: "Amount Breakdown",
      sortable: true,
      sortAccessor: (row) => row.gross_commission,
      cell: (row) => (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold tabular-nums text-white">
            Gross Commission {formatAmount(row.gross_commission, "neutral")}
          </p>
          <p className="text-xs tabular-nums text-zinc-400">
            Platform Retained {formatAmount(row.platform_amount, "negative")}
          </p>
          <p className="text-xs tabular-nums text-zinc-400">
            L2 Commission {formatAmount(row.l2_amount, row.l2_amount > 0 ? "negative" : "neutral")}
          </p>
          <p className="text-xs tabular-nums text-zinc-500">
            Remaining Pool {formatAmount(row.pool_amount, "neutral")}
          </p>
          <p className="text-xs tabular-nums text-zinc-300">
            Trader + L1 Distribution {formatAmount(row.trader_amount + row.l1_amount, "positive")}
          </p>
        </div>
      ),
      cellClassName: "py-4 pr-4",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${getStatusBadgeClass(
            row.status
          )}`}
        >
          {row.status}
        </span>
      ),
      cellClassName: "py-4 pr-4 align-middle",
    },
    {
      key: "settled_at",
      header: "Settled At",
      sortable: true,
      sortAccessor: (row) => new Date(row.settled_at).getTime(),
      cell: (row) => formatDateTime(row.settled_at),
      cellClassName: "py-4 pr-0 whitespace-nowrap text-sm text-zinc-400",
      headerClassName:
        "py-3 pr-0 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    },
  ];
}

export function getRebateRecordColumns(): DataTableColumn<RebateRecord>[] {
  return [
    {
      key: "rebate_id",
      header: "Rebate ID",
      cell: (row) => row.rebate_id,
      cellClassName: "py-4 pr-4 font-mono text-sm text-zinc-300",
    },
    {
      key: "beneficiary",
      header: "Beneficiary",
      sortable: true,
      sortAccessor: (row) => row.beneficiary,
      cell: (row) => <span className="font-medium text-white">{row.beneficiary}</span>,
      cellClassName: "py-4 pr-4",
    },
    {
      key: "account_id",
      header: "Account ID",
      cell: (row) => row.account_id,
      cellClassName: "py-4 pr-4 font-mono text-sm text-zinc-400",
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => formatAmount(row.amount, row.status === "reversed" ? "negative" : "positive"),
      headerClassName:
        "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName: "py-4 pr-4 text-right tabular-nums text-white",
    },
    {
      key: "rebate_type",
      header: "Type",
      cell: (row) => (
        <span className="inline-flex rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-zinc-300">
          {row.rebate_type}
        </span>
      ),
      cellClassName: "py-4 pr-4 align-middle",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] ${getStatusBadgeClass(
            row.status
          )}`}
        >
          {row.status}
        </span>
      ),
      cellClassName: "py-4 pr-4 align-middle",
    },
    {
      key: "created_at",
      header: "Created At",
      cell: (row) => formatDateTime(row.created_at),
      cellClassName: "py-4 pr-0 whitespace-nowrap text-sm text-zinc-400",
      headerClassName:
        "py-3 pr-0 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    },
  ];
}

export function CommissionPipelineCard({ stage }: { stage: CommissionPipelineStage }) {
  return (
    <div className="admin-surface-soft rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {stage.label}
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-300">{stage.description}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            {stage.metricLabel}
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-white">{stage.metricValue}</p>
        </div>
      </div>

      <div className="mt-4">
        <Link href={stage.href}>
          <AdminButton variant="ghost" className="px-0 text-sm">
            Open Stage
          </AdminButton>
        </Link>
      </div>
    </div>
  );
}

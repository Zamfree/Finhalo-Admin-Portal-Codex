"use client";

import { useMemo } from "react";

import { formatAmount } from "@/app/admin/finance/_shared";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import type { DashboardBrokerVolumeRow, DashboardLockedFundsRow } from "./_mock-data";

export function DashboardSectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm text-zinc-400">{description}</p>
    </div>
  );
}

export function LockedFundsPanel({ data }: { data: DashboardLockedFundsRow }) {
  return (
    <section className="admin-surface h-full rounded-2xl p-5 md:p-6">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          12-Hour Safety Lock
        </p>
        <p className="text-3xl font-semibold tabular-nums text-white">
          {formatAmount(data.locked_amount, "neutral")}
        </p>
        <p className="text-sm text-zinc-400">
          Funds currently held inside the safety review window before final release.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white/[0.03] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Affected Users
          </p>
          <p className="mt-2 text-lg font-semibold text-white">{data.affected_users}</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Review Window
          </p>
          <p className="mt-2 text-lg font-semibold text-white">{data.release_window_label}</p>
        </div>
      </div>
    </section>
  );
}

export function BrokerVolumeTable({ rows }: { rows: DashboardBrokerVolumeRow[] }) {
  const volumeFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  const integerFormatter = useMemo(() => new Intl.NumberFormat("en-US"), []);

  const columns = useMemo<DataTableColumn<DashboardBrokerVolumeRow>[]>(
    () => [
      {
        key: "broker",
        header: "Broker",
        cell: (row) => row.broker,
        cellClassName: "py-3 pr-4 text-sm text-zinc-200",
      },
      {
        key: "volume",
        header: "Volume",
        cell: (row) => volumeFormatter.format(row.volume),
        sortable: true,
        sortAccessor: (row) => row.volume,
        headerClassName:
          "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
        cellClassName: "py-3 pr-4 text-right tabular-nums text-zinc-200",
      },
      {
        key: "accounts",
        header: "Accounts",
        cell: (row) => integerFormatter.format(row.accounts),
        sortable: true,
        sortAccessor: (row) => row.accounts,
        headerClassName:
          "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
        cellClassName: "py-3 pr-4 text-right tabular-nums text-zinc-200",
      },
    ],
    [integerFormatter, volumeFormatter]
  );

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.broker}
      minWidthClassName="min-w-[520px]"
    />
  );
}

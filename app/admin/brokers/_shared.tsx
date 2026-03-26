import type { ReactNode } from "react";
import { format } from "date-fns";

import { SummaryCard } from "@/components/system/cards/summary-card";
import { DataPanel } from "@/components/system/data/data-panel";
import type { DataTableColumn } from "@/components/system/data/data-table";
import { StatusBadge } from "@/components/system/feedback/status-badge";
import type { SelectOption } from "@/types/system/option";

import type { BrokerListRow } from "./_types";

export { SummaryCard };

export function getBrokerStatusClass(status: BrokerListRow["status"]) {
  return status === "active"
    ? "bg-emerald-500/10 text-emerald-300"
    : "bg-zinc-500/10 text-zinc-300";
}

export function getBrokerColumns(): DataTableColumn<BrokerListRow>[] {
  return [
    {
      key: "broker_id",
      header: "Broker ID",
      cell: (row) => row.broker_id,
      cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-400",
    },
    {
      key: "broker_name",
      header: "Broker Name",
      cell: (row) => <span className="block truncate font-medium text-white">{row.broker_name}</span>,
      cellClassName: "py-3 pr-4",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge size="default" toneClassName={getBrokerStatusClass(row.status)}>
          {row.status}
        </StatusBadge>
      ),
      cellClassName: "py-3 pr-4",
    },
    {
      key: "accounts",
      header: "Accounts",
      cell: (row) => row.accounts,
      headerClassName:
        "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName: "py-3 pr-4 text-right tabular-nums text-zinc-300",
    },
    {
      key: "created_at",
      header: "Created At",
      cell: (row) => format(new Date(row.created_at), "yyyy-MM-dd"),
      cellClassName: "py-3 pr-0 text-sm text-zinc-400",
      headerClassName:
        "py-3 pr-0 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    },
  ];
}

export const brokerStatusFilterOptions: SelectOption[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export function BrokerOverviewPanel({ broker }: { broker: BrokerListRow }) {
  return (
    <DataPanel
      title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Overview</h3>}
    >
      <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <DetailItem label="Broker ID" value={broker.broker_id} mono />
        <DetailItem label="Broker Name" value={broker.broker_name} />
        <DetailItem
          label="Status"
          value={<StatusBadge toneClassName={getBrokerStatusClass(broker.status)}>{broker.status}</StatusBadge>}
        />
        <DetailItem label="Created At" value={format(new Date(broker.created_at), "yyyy-MM-dd HH:mm:ss")} />
      </dl>
    </DataPanel>
  );
}

export function BrokerContextPanel({ broker }: { broker: BrokerListRow }) {
  return (
    <div className="space-y-4">
      <DataPanel
        title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Context</h3>}
      >
        <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <DetailItem label="Account Count" value={String(broker.accounts)} />
          <DetailItem
            label="Operational Context"
            value={
              broker.status === "active"
                ? "Broker is active for batch intake and downstream account coverage."
                : "Broker remains visible for historical review and setup maintenance."
            }
          />
        </dl>
      </DataPanel>

      <DataPanel
        title={
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Operational Setup
          </h3>
        }
        description={
          <p className="text-sm text-zinc-400">
            Import configuration, mapping rules, commission setup, and account type coverage live in
            the broker detail page.
          </p>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <SetupPill label="Import Configuration" />
          <SetupPill label="Field Mapping Rules" />
          <SetupPill label="Commission Setup" />
          <SetupPill label="Account Type Coverage" />
        </div>
      </DataPanel>
    </div>
  );
}

export function BrokerRelatedActivityPanel({ broker }: { broker: BrokerListRow }) {
  return (
    <DataPanel
      title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Related Activity</h3>}
    >
      <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
        <DetailItem label="Linked Accounts" value={String(broker.accounts)} />
        <DetailItem label="Commission Batches" value={String(broker.commission_batches)} />
        <DetailItem label="Latest Batch" value={broker.latest_batch_id ?? "—"} mono />
      </dl>
    </DataPanel>
  );
}

function SetupPill({ label }: { label: string }) {
  return (
    <div className="admin-surface-soft rounded-2xl px-4 py-3">
      <p className="text-xs font-medium text-zinc-300">{label}</p>
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</dt>
      <dd
        className={
          mono
            ? "min-w-0 break-all font-mono text-sm text-zinc-300"
            : "min-w-0 break-words text-sm text-zinc-300"
        }
      >
        {value}
      </dd>
    </div>
  );
}

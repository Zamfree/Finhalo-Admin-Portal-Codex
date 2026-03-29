import type { ReactNode } from "react";
import { format } from "date-fns";
import Link from "next/link";

import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";
import { formatTruncatedNumber } from "@/lib/money-display";

import type {
  BrokerAccountTypeCoverage,
  BrokerCommissionConfiguration,
  BrokerDetailSummary,
  BrokerImportConfiguration,
  BrokerMappingRule,
  RecentBatchRow,
} from "./_types";

export const recentBatchColumns: DataTableColumn<RecentBatchRow>[] = [
  {
    key: "batch_id",
    header: "Batch ID",
    cell: (row) => row.batch_id,
    cellClassName: "py-3 pr-6 font-mono text-sm text-zinc-400",
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => <span className="text-xs uppercase tracking-[0.12em] text-zinc-300">{row.status}</span>,
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

export function RecentBatchesTable({ rows }: { rows: RecentBatchRow[] }) {
  return (
    <DataTable
      columns={recentBatchColumns}
      rows={rows}
      getRowKey={(row) => row.batch_id}
      minWidthClassName="min-w-[700px]"
    />
  );
}

export function BrokerDetailMetricCard({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="admin-surface-soft p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-3 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

export function BrokerDetailMetrics({
  brokerId,
  summary,
}: {
  brokerId: string;
  summary: BrokerDetailSummary;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-4">
      <BrokerDetailMetricCard label="Broker ID" value={brokerId} />
      <BrokerDetailMetricCard label="Total Commission" value={formatTruncatedNumber(summary.total_commission)} />
      <BrokerDetailMetricCard label="Total Rebate" value={formatTruncatedNumber(summary.total_rebate)} />
      <BrokerDetailMetricCard label="Platform Profit" value={formatTruncatedNumber(summary.platform_profit)} />
    </section>
  );
}

export function BrokerRecentBatchesPanel({ rows }: { rows: RecentBatchRow[] }) {
  return (
    <DataPanel
      title={<h2 className="text-xl font-semibold text-white">Recent Batches</h2>}
      actions={
        <Link href="/admin/commission/batches">
          <AdminButton variant="secondary" className="h-11 px-5">
            Open in commissions
          </AdminButton>
        </Link>
      }
    >
      <RecentBatchesTable rows={rows} />
    </DataPanel>
  );
}

export function BrokerImportConfigPanel({ config }: { config: BrokerImportConfiguration }) {
  return (
    <DataPanel
      title={<h2 className="text-xl font-semibold text-white">Import Configuration</h2>}
      description={
        <p className="max-w-2xl text-sm text-zinc-400">
          The import profile defines how source files enter the commission pipeline before batch review.
        </p>
      }
    >
      <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <DetailItem label="Source Format" value={config.source_format} />
        <DetailItem label="Ingestion Mode" value={config.ingestion_mode} />
        <DetailItem label="Timezone" value={config.timezone} />
        <DetailItem label="Latest Import" value={format(new Date(config.latest_import_at), "yyyy-MM-dd HH:mm:ss")} />
      </dl>
    </DataPanel>
  );
}

export function BrokerCommissionConfigPanel({
  config,
}: {
  config: BrokerCommissionConfiguration;
}) {
  return (
    <DataPanel
      title={<h2 className="text-xl font-semibold text-white">Commission Configuration</h2>}
      description={
        <p className="max-w-2xl text-sm text-zinc-400">
          Review the broker-specific commission posture before moving into batch approval.
        </p>
      }
    >
      <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <DetailItem label="Calculation Model" value={config.calculation_model} />
        <DetailItem label="Settlement Window" value={config.settlement_window} />
        <DetailItem label="Rebate Depth" value={config.rebate_depth} />
        <DetailItem label="Admin Fee Floor" value={config.admin_fee_floor} />
      </dl>
    </DataPanel>
  );
}

const mappingRuleColumns: DataTableColumn<BrokerMappingRule>[] = [
  {
    key: "field_label",
    header: "Field",
    cell: (row) => row.field_label,
    cellClassName: "py-3 pr-4 font-medium text-white",
  },
  {
    key: "source_column",
    header: "Source Column",
    cell: (row) => row.source_column,
    cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-400",
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => <StatusPill value={row.status} />,
    cellClassName: "py-3 pr-4",
  },
  {
    key: "note",
    header: "Operational Note",
    cell: (row) => row.note,
    cellClassName: "py-3 pr-0 text-sm text-zinc-300",
  },
];

export function BrokerMappingRulesPanel({ rows }: { rows: BrokerMappingRule[] }) {
  return (
    <DataPanel
      title={<h2 className="text-xl font-semibold text-white">Mapping Rules</h2>}
      description={
        <p className="max-w-3xl text-sm text-zinc-400">
          These mappings define how broker source columns resolve into commission batch records.
        </p>
      }
    >
      <DataTable
        columns={mappingRuleColumns}
        rows={rows}
        getRowKey={(row) => row.rule_id}
        minWidthClassName="min-w-[720px]"
      />
    </DataPanel>
  );
}

const accountTypeColumns: DataTableColumn<BrokerAccountTypeCoverage>[] = [
  {
    key: "account_type",
    header: "Account Type",
    cell: (row) => row.account_type,
    cellClassName: "py-3 pr-4 font-medium text-white",
  },
  {
    key: "rebate_eligible",
    header: "Rebate Eligible",
    cell: (row) => (row.rebate_eligible ? "Yes" : "No"),
    cellClassName: "py-3 pr-4 text-sm text-zinc-300",
  },
  {
    key: "mapping_status",
    header: "Mapping Status",
    cell: (row) => <StatusPill value={row.mapping_status} />,
    cellClassName: "py-3 pr-4",
  },
  {
    key: "note",
    header: "Operational Note",
    cell: (row) => row.note,
    cellClassName: "py-3 pr-0 text-sm text-zinc-300",
  },
];

export function BrokerAccountTypeCoveragePanel({
  rows,
}: {
  rows: BrokerAccountTypeCoverage[];
}) {
  return (
    <DataPanel
      title={<h2 className="text-xl font-semibold text-white">Account Type Coverage</h2>}
      description={
        <p className="max-w-3xl text-sm text-zinc-400">
          Coverage clarifies which broker account groups feed rebate processing and which remain outside the posting pipeline.
        </p>
      }
    >
      <DataTable
        columns={accountTypeColumns}
        rows={rows}
        getRowKey={(row) => row.account_type}
        minWidthClassName="min-w-[720px]"
      />
    </DataPanel>
  );
}

function StatusPill({ value }: { value: string }) {
  const className =
    value === "ready" || value === "mapped"
      ? "bg-emerald-500/10 text-emerald-300"
      : "bg-amber-500/10 text-amber-300";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${className}`}>
      {value}
    </span>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</dt>
      <dd className="text-sm text-zinc-300">{value}</dd>
    </div>
  );
}

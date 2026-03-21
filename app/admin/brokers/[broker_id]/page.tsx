import { DataPanel } from "@/components/system/data/data-panel";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";

type BrokerDetailProps = {
  params: Promise<{
    broker_id: string;
  }>;
};

type RecentBatchRow = {
  batch_id: string;
  status: string;
  records: number;
  imported_at: string;
};

const MOCK_BROKER_SUMMARY = {
  total_commission: 231120.55,
  total_rebate: 72120.34,
  platform_profit: 31220.76,
  active_batches: 12,
};

const MOCK_RECENT_BATCHES: RecentBatchRow[] = [
  { batch_id: "BATCH-2401", status: "approved", records: 210, imported_at: "2026-03-18T06:14:00Z" },
  { batch_id: "BATCH-2407", status: "pending", records: 198, imported_at: "2026-03-19T04:20:00Z" },
  { batch_id: "BATCH-2410", status: "pending", records: 176, imported_at: "2026-03-19T09:05:00Z" },
];

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

export default async function BrokerDetailPage({ params }: BrokerDetailProps) {
  const { broker_id } = await params;

  return (
    <div className="space-y-6 pb-8">
      <section>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Brokers
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          Broker Detail
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          Preview-mode broker analytics and recent commission batch context.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="admin-surface-soft p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Broker ID
          </p>
          <p className="mt-3 text-xl font-semibold text-white">{broker_id}</p>
        </div>
        <div className="admin-surface-soft p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Total Commission
          </p>
          <p className="mt-3 text-xl font-semibold text-white">
            {MOCK_BROKER_SUMMARY.total_commission.toLocaleString()}
          </p>
        </div>
        <div className="admin-surface-soft p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Total Rebate
          </p>
          <p className="mt-3 text-xl font-semibold text-white">
            {MOCK_BROKER_SUMMARY.total_rebate.toLocaleString()}
          </p>
        </div>
        <div className="admin-surface-soft p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Platform Profit
          </p>
          <p className="mt-3 text-xl font-semibold text-white">
            {MOCK_BROKER_SUMMARY.platform_profit.toLocaleString()}
          </p>
        </div>
      </section>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Recent Batches</h2>}
        actions={
          <button
            type="button"
            className="h-11 rounded-xl border border-white/10 bg-white/5 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            Open in commissions
          </button>
        }
      >
        <DataTable
          columns={recentBatchColumns}
          rows={MOCK_RECENT_BATCHES}
          getRowKey={(row) => row.batch_id}
          minWidthClassName="min-w-[700px]"
        />
      </DataPanel>
    </div>
  );
}

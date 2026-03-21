import Link from "next/link";

import { BatchApprovalForm } from "@/components/commissions/batch-approval-form";
import { DataPanel } from "@/components/system/data/data-panel";
import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";

type BatchDetailProps = {
  params: Promise<{
    batch_id: string;
  }>;
};

type CommissionBatchRow = {
  batch_id: string;
  broker: string;
  import_date: string;
  record_count: number;
  status: string;
};

type CommissionRecordRow = {
  account_number: string;
  symbol: string;
  volume: number;
  commission_amount: number;
  commission_date: string;
};

const MOCK_BATCH: Omit<CommissionBatchRow, "batch_id"> = {
  broker: "BrokerOne",
  import_date: "2026-03-19T03:10:00Z",
  record_count: 264,
  status: "pending",
};

const MOCK_RECORDS: CommissionRecordRow[] = [
  { account_number: "8800123", symbol: "EURUSD", volume: 2.4, commission_amount: 18.75, commission_date: "2026-03-18" },
  { account_number: "8800456", symbol: "XAUUSD", volume: 1.1, commission_amount: 9.5, commission_date: "2026-03-18" },
  { account_number: "8800789", symbol: "GBPUSD", volume: 3.8, commission_amount: 23.4, commission_date: "2026-03-17" },
  { account_number: "8800456", symbol: "EURUSD", volume: 0.7, commission_amount: 5.35, commission_date: "2026-03-17" },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

const recordColumns: DataTableColumn<CommissionRecordRow>[] = [
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
  },
  {
    key: "commission_amount",
    header: "Commission",
    cell: (record) => formatCurrency(record.commission_amount),
    headerClassName:
      "py-2.5 pr-6 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-6 text-right tabular-nums text-white",
  },
  {
    key: "commission_date",
    header: "Trade Date",
    cell: (record) => new Date(record.commission_date).toLocaleDateString(),
    headerClassName:
      "py-2.5 pr-0 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-0 text-sm text-zinc-400",
  },
];

export default async function CommissionBatchDetailPage({ params }: BatchDetailProps) {
  const { batch_id } = await params;

  const batch: CommissionBatchRow = { ...MOCK_BATCH, batch_id };
  const records = MOCK_RECORDS;

  const summary = {
    displayedRecords: records.length,
    totalCommission: records.reduce((sum, row) => sum + row.commission_amount, 0),
    uniqueAccounts: new Set(records.map((row) => row.account_number)).size,
  };

  return (
    <div className="space-y-6 pb-8">
      <section>
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/admin/commissions"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            Back to commission batches
          </Link>
          <span className="admin-surface-soft rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Source data preview
          </span>
        </div>

        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Commission
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          Batch Detail
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          Imported commission source records for investigation and validation.
        </p>
      </section>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Batch Overview</h2>}
        actions={
          <BatchApprovalForm batchId={batch.batch_id} disabled={batch.status === "approved"} />
        }
      >
        <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Batch ID
            </dt>
            <dd className="mt-2 font-mono text-zinc-200">{batch.batch_id}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Broker
            </dt>
            <dd className="mt-2 text-zinc-200">{batch.broker}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Import Date
            </dt>
            <dd className="mt-2 text-zinc-200">
              {new Date(batch.import_date).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Record Count
            </dt>
            <dd className="mt-2 text-zinc-200">{batch.record_count.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Status
            </dt>
            <dd className="mt-2 text-zinc-200">{batch.status}</dd>
          </div>
        </dl>
      </DataPanel>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="admin-surface-soft p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Displayed Records
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {summary.displayedRecords.toLocaleString()}
          </p>
        </div>
        <div className="admin-surface-soft p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Total Commission
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {formatCurrency(summary.totalCommission)}
          </p>
        </div>
        <div className="admin-surface-soft p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Unique Accounts
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {summary.uniqueAccounts.toLocaleString()}
          </p>
        </div>
      </section>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Commission Records</h2>}
        actions={
          <button
            type="button"
            className="h-11 rounded-xl border border-white/10 bg-white/5 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            Filter
          </button>
        }
      >
        <DataTable
          columns={recordColumns}
          rows={records}
          getRowKey={(record) =>
            `${record.account_number}-${record.symbol}-${record.commission_date}-${record.commission_amount}`
          }
          minWidthClassName="min-w-[760px]"
        />
      </DataPanel>
    </div>
  );
}

import Link from "next/link";

import { BatchApprovalForm } from "@/components/commissions/batch-approval-form";

type BatchDetailProps = {
  params: Promise<{
    batch_id: string;
  }>;
  searchParams: Promise<{
    query?: string;
    symbol?: string;
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

export default async function CommissionBatchDetailPage({ params, searchParams }: BatchDetailProps) {
  const { batch_id } = await params;
  const parsedSearchParams = await searchParams;

  const query = parsedSearchParams.query?.trim() ?? "";
  const symbolFilter = parsedSearchParams.symbol?.trim() ?? "";

  const batch: CommissionBatchRow = { ...MOCK_BATCH, batch_id };

  const records = MOCK_RECORDS.filter((record) => {
    const queryMatch =
      !query ||
      record.account_number.toLowerCase().includes(query.toLowerCase()) ||
      record.symbol.toLowerCase().includes(query.toLowerCase());

    const symbolMatch = !symbolFilter || record.symbol === symbolFilter;

    return queryMatch && symbolMatch;
  });

  const symbols = Array.from(new Set(MOCK_RECORDS.map((row) => row.symbol))).sort((a, b) => a.localeCompare(b));

  const summary = {
    displayedRecords: records.length,
    totalCommission: records.reduce((sum, row) => sum + row.commission_amount, 0),
    uniqueAccounts: new Set(records.map((row) => row.account_number)).size,
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <Link href="/admin/commissions" className="rounded-md border px-2 py-1 text-xs hover:bg-muted">
            ← Back to commission batches
          </Link>
          <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">Source data preview</span>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="mb-4 text-base font-semibold">Commission Batch Detail</h2>
            <p className="mb-3 text-sm text-muted-foreground">Imported commission source records for investigation and validation.</p>
            <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Batch ID</dt>
                <dd>{batch.batch_id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Broker</dt>
                <dd>{batch.broker}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Import Date</dt>
                <dd>{new Date(batch.import_date).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Record Count</dt>
                <dd>{batch.record_count.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>{batch.status}</dd>
              </div>
            </dl>
          </div>

          <BatchApprovalForm batchId={batch.batch_id} disabled={batch.status === "approved"} />
        </div>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h3 className="mb-3 text-base font-semibold">Batch Summary</h3>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground">Displayed Records</p>
            <p className="mt-1 text-lg font-semibold">{summary.displayedRecords.toLocaleString()}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground">Total Commission</p>
            <p className="mt-1 text-lg font-semibold">{formatCurrency(summary.totalCommission)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground">Unique Accounts</p>
            <p className="mt-1 text-lg font-semibold">{summary.uniqueAccounts.toLocaleString()}</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h3 className="mb-4 text-base font-semibold">Commission Records</h3>

        <form className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
          <div className="w-full md:max-w-sm">
            <label htmlFor="query" className="mb-1 block text-sm font-medium">
              Search records
            </label>
            <input
              id="query"
              name="query"
              defaultValue={query}
              placeholder="Search by account number or symbol"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="w-full md:max-w-xs">
            <label htmlFor="symbol" className="mb-1 block text-sm font-medium">
              Filter records
            </label>
            <select
              id="symbol"
              name="symbol"
              defaultValue={symbolFilter}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">All symbols</option>
              {symbols.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="rounded-md border px-3 py-2 text-sm hover:bg-muted">
            Apply
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Account Number</th>
                <th className="py-2 pr-4 font-medium">Symbol</th>
                <th className="py-2 pr-4 font-medium">Lot</th>
                <th className="py-2 pr-4 font-medium">Commission</th>
                <th className="py-2 pr-4 font-medium">Trade Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr key={`${record.account_number}-${record.symbol}-${record.commission_date}-${index}`} className="border-b last:border-0">
                  <td className="py-2 pr-4">{record.account_number}</td>
                  <td className="py-2 pr-4">{record.symbol}</td>
                  <td className="py-2 pr-4">{record.volume.toLocaleString()}</td>
                  <td className="py-2 pr-4">{formatCurrency(record.commission_amount)}</td>
                  <td className="py-2 pr-4">{new Date(record.commission_date).toLocaleDateString()}</td>
                </tr>
              ))}
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    No commission records found for this batch.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

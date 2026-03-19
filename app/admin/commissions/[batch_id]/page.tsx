import Link from "next/link";
import { notFound } from "next/navigation";

import { BatchApprovalForm } from "@/components/commissions/batch-approval-form";
import { supabaseServer } from "@/lib/supabase/server";

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
  user_id?: string | null;
  symbol: string;
  volume: number;
  commission_amount: number;
  commission_date: string;
};

type RawRow = Record<string, unknown>;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function asNonEmptyString(value: unknown, fallback = "-"): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function asNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asDateString(value: unknown): string {
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return value;
  }

  return "";
}

function formatDateTime(value: string): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString();
}

function formatDate(value: string): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString();
}

function normalizeBatch(row: RawRow): CommissionBatchRow | null {
  const batchId = asNonEmptyString(row.batch_id ?? row.id, "");

  if (!batchId) {
    return null;
  }

  return {
    batch_id: batchId,
    broker: asNonEmptyString(row.broker ?? row.broker_name),
    import_date: asDateString(row.import_date ?? row.created_at),
    record_count: asNumber(row.record_count ?? row.total_records),
    status: asNonEmptyString(row.status),
  };
}

function normalizeRecord(row: RawRow): CommissionRecordRow | null {
  const accountNumber = asNonEmptyString(row.account_number ?? row.account_id, "");

  if (!accountNumber) {
    return null;
  }

  return {
    account_number: accountNumber,
    symbol: asNonEmptyString(row.symbol),
    volume: asNumber(row.volume ?? row.lot),
    commission_amount: asNumber(row.commission_amount ?? row.amount),
    commission_date: asDateString(row.commission_date ?? row.trade_date),
  };
}

function includesQuery(query: string, row: CommissionRecordRow): boolean {
  const normalizedQuery = query.toLowerCase();

  return [row.account_number, row.symbol].some((value) => value.toLowerCase().includes(normalizedQuery));
}

export default async function CommissionBatchDetailPage({ params, searchParams }: BatchDetailProps) {
  const { batch_id } = await params;
  const parsedSearchParams = await searchParams;

  const query = parsedSearchParams.query?.trim() ?? "";
  const symbolFilter = parsedSearchParams.symbol?.trim() ?? "";

  const { data: batchData, error: batchError } = await supabaseServer
    .from("commission_batches")
    .select("*")
    .eq("batch_id", batch_id)
    .maybeSingle();

  const batch = batchError || !batchData ? null : normalizeBatch(batchData as RawRow);

  if (!batch) {
    notFound();
  }

  const { data: recordsData, error: recordsError } = await supabaseServer
    .from("commission_records")
    .select("*")
    .eq("batch_id", batch_id)
    .limit(500);

  const allRecords = recordsError || !recordsData
    ? []
    : (recordsData as RawRow[])
        .map((row) => normalizeRecord(row))
        .filter((row): row is CommissionRecordRow => row !== null)
        .sort((a, b) => Date.parse(b.commission_date || "") - Date.parse(a.commission_date || ""));

  const symbols = Array.from(new Set(allRecords.map((row) => row.symbol).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );

  const records = allRecords.filter((row) => {
    const queryMatch = query ? includesQuery(query, row) : true;
    const symbolMatch = symbolFilter ? row.symbol === symbolFilter : true;

    return queryMatch && symbolMatch;
  });

  const summary = {
    displayedRecords: records.length,
    totalCommission: records.reduce((sum, row) => sum + row.commission_amount, 0),
    uniqueAccounts: new Set(records.map((row) => row.account_number).filter(Boolean)).size,
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="mb-4 text-base font-semibold">Commission Batch Detail</h2>
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
                <dd>{formatDateTime(batch.import_date)}</dd>
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
                  <td className="py-2 pr-4">{formatDate(record.commission_date)}</td>
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

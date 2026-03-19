import Link from "next/link";
import { notFound } from "next/navigation";

import { BatchApprovalForm } from "@/components/commissions/batch-approval-form";
import { supabaseServer } from "@/lib/supabase/server";

type BatchDetailProps = {
  params: Promise<{
    batch_id: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
  user_id: string | null;
  symbol: string;
  volume: number;
  commission_amount: number;
  commission_date: string;
};

function asNonEmptyString(value: unknown, fallback = "-"): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function asOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString();
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString();
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function canUseRouteParam(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0 && value !== "-";
}

function buildSearchHref(queryValue: string | null | undefined): string | null {
  if (!canUseRouteParam(queryValue)) {
    return null;
  }

  const params = new URLSearchParams();
  params.set("q", queryValue.trim());
  return `/admin/search?${params.toString()}`;
}

function buildUserDetailHref(userId: string | null | undefined): string | null {
  if (!canUseRouteParam(userId)) {
    return null;
  }

  return `/admin/users/${userId.trim()}`;
}

function normalizeRecord(row: Record<string, unknown>): CommissionRecordRow | null {
  const accountNumber = asNonEmptyString(row.account_number, "");

  if (!accountNumber) {
    return null;
  }

  return {
    account_number: accountNumber,
    user_id: asOptionalString(row.user_id),
    symbol: asNonEmptyString(row.symbol),
    volume: asNumber(row.volume),
    commission_amount: asNumber(row.commission_amount),
    commission_date: asNonEmptyString(row.commission_date, ""),
  };
}

export default async function CommissionBatchDetailPage({ params, searchParams }: BatchDetailProps) {
  const { batch_id } = await params;
  const parsedSearchParams = await searchParams;

  const getParam = (key: string): string => {
    const value = parsedSearchParams[key];
    if (Array.isArray(value)) {
      return value[0]?.trim() ?? "";
    }
    return value?.trim() ?? "";
  };

  const query = getParam("query");
  const symbolFilter = getParam("symbol");

  const batchListParams = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(parsedSearchParams)) {
    if (key === "query" || key === "symbol") {
      continue;
    }

    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    const trimmed = value?.trim();

    if (trimmed) {
      batchListParams.set(key, trimmed);
    }
  }

const query = batchListParams.toString();
const batchListHref = query ? `/admin/commissions?${query}` : "/admin/commissions";
  const { data: batchData, error: batchError } = await supabaseServer
    .from("commission_batches")
    .select("batch_id,broker,import_date,record_count,status")
    .eq("batch_id", batch_id)
    .single();

  if (batchError) {
    if (batchError.code === "PGRST116") {
      notFound();
    }

    throw new Error(batchError.message);
  }

  let recordsQuery = supabaseServer
    .from("commission_records")
    .select("account_number,user_id,symbol,volume,commission_amount,commission_date")
    .eq("batch_id", batch_id)
    .order("commission_date", { ascending: false })
    .limit(500);

  if (query) {
    recordsQuery = recordsQuery.or(`account_number.ilike.%${query}%,symbol.ilike.%${query}%`);
  }

  if (symbolFilter) {
    recordsQuery = recordsQuery.eq("symbol", symbolFilter);
  }

  const [{ data: recordsData, error: recordsError }, { data: symbolData, error: symbolError }] =
    await Promise.all([
      recordsQuery,
      supabaseServer.from("commission_records").select("symbol").eq("batch_id", batch_id).limit(500),
    ]);

  if (recordsError) {
    throw new Error(recordsError.message);
  }

  if (symbolError) {
    throw new Error(symbolError.message);
  }

  const batch = batchData as CommissionBatchRow;
  const records = ((recordsData as Record<string, unknown>[] | null) ?? [])
    .map((row) => normalizeRecord(row))
    .filter((row): row is CommissionRecordRow => row !== null);

  const symbols = Array.from(new Set(((symbolData as { symbol: string }[] | null) ?? []).map((row) => row.symbol)))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const summary = {
    displayedRecords: records.length,
    totalCommission: records.reduce((sum, row) => sum + row.commission_amount, 0),
    uniqueAccounts: new Set(records.map((row) => row.account_number).filter(Boolean)).size,
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Link href={batchListHref} className="text-primary hover:underline">
            ← Back to commission batches
          </Link>
          <span className="rounded border px-2 py-0.5">Source page for imported commission records</span>
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="mb-4 text-base font-semibold">Commission Batch Detail</h2>
            <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Batch ID</dt>
                <dd>{asNonEmptyString(batch.batch_id)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Broker</dt>
                <dd>{asNonEmptyString(batch.broker)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Import Date</dt>
                <dd>{formatDateTime(asNonEmptyString(batch.import_date, ""))}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Record Count</dt>
                <dd>{asNumber(batch.record_count).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>{asNonEmptyString(batch.status)}</dd>
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
        <h3 className="mb-1 text-base font-semibold">Commission Records</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Commission source data for this batch. Downstream rebate and finance entries may be derived from these records.
        </p>

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
              {records.map((record, index) => {
                const accountSearchHref = buildSearchHref(record.account_number);
                const userDetailHref = buildUserDetailHref(record.user_id);

                return (
                  <tr key={`${record.account_number}-${record.symbol}-${record.commission_date}-${index}`} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      <div className="font-mono text-xs md:text-sm">
                        {accountSearchHref ? (
                          <Link href={accountSearchHref} className="text-primary hover:underline">
                            {record.account_number}
                          </Link>
                        ) : (
                          record.account_number
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {userDetailHref ? (
                          <Link href={userDetailHref} className="text-primary hover:underline">
                            User {record.user_id}
                          </Link>
                        ) : (
                          <>User -</>
                        )}
                        {" · Source row"}
                      </div>
                    </td>
                    <td className="py-2 pr-4">{record.symbol}</td>
                    <td className="py-2 pr-4">{record.volume.toLocaleString()}</td>
                    <td className="py-2 pr-4">{formatCurrency(record.commission_amount)}</td>
                    <td className="py-2 pr-4">{formatDate(record.commission_date)}</td>
                  </tr>
                );
              })}
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

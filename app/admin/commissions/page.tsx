import Link from "next/link";
import { CsvUploadForm } from "@/components/commissions/csv-upload-form";
import { createClient } from "@/lib/supabase/server";

type BatchRow = {
  batch_id: string;
  broker: string;
  import_date: string;
  record_count: number;
  status: string;
};

type RawBatchRow = Record<string, unknown>;

type SearchParams = {
  broker?: string;
  status?: string;
};

type CommissionsPageProps = {
  searchParams: Promise<SearchParams>;
};

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

function normalizeBatchRow(row: RawBatchRow): BatchRow | null {
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

function formatImportDate(value: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

async function getBatches(filters: SearchParams) {
  const supabase = await createClient();
  let query = supabase.from("commission_batches").select("*").limit(100);

  if (filters.broker) {
    query = query.ilike("broker", `%${filters.broker}%`);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Error fetching batches:", error);
    return [];
  }

  return (data as RawBatchRow[])
    .map((row) => normalizeBatchRow(row))
    .filter((row): row is BatchRow => row !== null)
    .sort((a, b) => {
      const aTs = Date.parse(a.import_date || "");
      const bTs = Date.parse(b.import_date || "");
      if (Number.isNaN(aTs) && Number.isNaN(bTs)) return 0;
      if (Number.isNaN(aTs)) return 1;
      if (Number.isNaN(bTs)) return -1;
      return bTs - aTs;
    });
}

export default async function CommissionsPage({ searchParams }: CommissionsPageProps) {
  const params = await searchParams;
  const batches = await getBatches(params);

  const hasActiveFilters = Boolean(params.broker || params.status);

  return (
    <div className="space-y-6">
      <CsvUploadForm />

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Commission Batches</h2>
          {hasActiveFilters && (
            <Link
              href="/admin/commissions"
              className="text-xs text-muted-foreground hover:text-primary hover:underline"
            >
              Clear all filters
            </Link>
          )}
        </div>

        <form className="mb-6 grid gap-3 md:grid-cols-4 md:items-end">
          <div className="md:col-span-2">
            <label htmlFor="broker" className="mb-1 block text-sm font-medium">
              Filter by Broker
            </label>
            <input
              id="broker"
              name="broker"
              defaultValue={params.broker}
              placeholder="Broker name..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium">
              Filter by Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={params.status}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Apply filters
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Batch ID</th>
                <th className="py-2 pr-4 font-medium">Broker</th>
                <th className="py-2 pr-4 font-medium">Import Date</th>
                <th className="py-2 pr-4 font-medium">Record Count</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.batch_id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{batch.batch_id}</td>
                  <td className="py-3 pr-4 font-medium">{batch.broker}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{formatImportDate(batch.import_date)}</td>
                  <td className="py-3 pr-4">{batch.record_count.toLocaleString()}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      batch.status === 'completed' ? 'bg-green-100 text-green-700' :
                      batch.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      batch.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <Link
                      href={`/admin/commissions/${batch.batch_id}`}
                      className="inline-flex items-center rounded-md border bg-background px-2.5 py-1 text-xs font-medium shadow-sm hover:bg-muted transition-colors"
                    >
                      Open detail
                    </Link>
                  </td>
                </tr>
              ))}
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground italic">
                    No commission batches found matching the current filters.
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

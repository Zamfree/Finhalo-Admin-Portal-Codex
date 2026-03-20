import Link from "next/link";

import { CsvUploadForm } from "@/components/commissions/csv-upload-form";

type BatchRow = {
  batch_id: string;
  broker: string;
  import_date: string;
  record_count: number;
  status: string;
};

type RawBatchRow = Record<string, unknown>;

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
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
}

async function getBatches() {
  const { data, error } = await supabaseServer
    .from("commission_batches")
    .select("*")
    .limit(100);

  if (error || !data) {
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

export default async function CommissionsPage() {
  const batches = MOCK_BATCHES;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-lg font-semibold">Commissions</h1>
        <p className="text-sm text-muted-foreground">Preview commission batches with static data to validate workflow and routing.</p>
      </section>

      <CsvUploadForm />

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Commission Batches</h2>
          <button type="button" className="rounded-md border px-3 py-2 text-xs text-muted-foreground" disabled>
            Export CSV (Preview)
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Batch ID</th>
                <th className="py-2 pr-4 font-medium">Broker</th>
                <th className="py-2 pr-4 font-medium">Import Date</th>
                <th className="py-2 pr-4 font-medium">Record Count</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.batch_id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-mono text-xs md:text-sm">{batch.batch_id}</td>
                  <td className="py-2 pr-4">{batch.broker}</td>
                  <td className="py-2 pr-4">{formatImportDate(batch.import_date)}</td>
                  <td className="py-2 pr-4">{batch.record_count.toLocaleString()}</td>
                  <td className="py-2 pr-4">{batch.status}</td>
                  <td className="py-2 pr-4">
                    <Link
                      href={`/admin/commissions/${batch.batch_id}`}
                      className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
                    >
                      Open detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

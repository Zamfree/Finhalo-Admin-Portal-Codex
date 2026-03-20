import Link from "next/link";

import { CsvUploadForm } from "@/components/commissions/csv-upload-form";

type BatchRow = {
  batch_id: string;
  broker: string;
  import_date: string;
  record_count: number;
  status: string;
};

const MOCK_BATCHES: BatchRow[] = [
  { batch_id: "BATCH-2401", broker: "BrokerOne", import_date: "2026-03-18T06:14:00Z", record_count: 210, status: "approved" },
  { batch_id: "BATCH-2402", broker: "Prime Markets", import_date: "2026-03-18T12:25:00Z", record_count: 185, status: "pending" },
  { batch_id: "BATCH-2403", broker: "Vertex Trade", import_date: "2026-03-19T03:10:00Z", record_count: 264, status: "pending" },
];

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
                  <td className="py-2 pr-4">{batch.batch_id}</td>
                  <td className="py-2 pr-4">{batch.broker}</td>
                  <td className="py-2 pr-4">{new Date(batch.import_date).toLocaleString()}</td>
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

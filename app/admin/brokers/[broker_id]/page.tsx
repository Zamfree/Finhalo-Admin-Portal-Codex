type BrokerDetailProps = {
  params: Promise<{
    broker_id: string;
  }>;
};

const MOCK_BROKER_SUMMARY = {
  total_commission: 231120.55,
  total_rebate: 72120.34,
  platform_profit: 31220.76,
  active_batches: 12,
};

const MOCK_RECENT_BATCHES = [
  { batch_id: "BATCH-2401", status: "approved", records: 210, imported_at: "2026-03-18T06:14:00Z" },
  { batch_id: "BATCH-2407", status: "pending", records: 198, imported_at: "2026-03-19T04:20:00Z" },
  { batch_id: "BATCH-2410", status: "pending", records: 176, imported_at: "2026-03-19T09:05:00Z" },
];

export default async function BrokerDetailPage({ params }: BrokerDetailProps) {
  const { broker_id } = await params;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-lg font-semibold">Broker Detail</h1>
        <p className="text-sm text-muted-foreground">Preview-mode broker analytics and recent commission batch context.</p>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Broker ID</p>
          <p className="mt-1 text-base font-semibold">{broker_id}</p>
        </div>
        <div className="rounded-lg border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total Commission</p>
          <p className="mt-1 text-base font-semibold">{MOCK_BROKER_SUMMARY.total_commission.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Total Rebate</p>
          <p className="mt-1 text-base font-semibold">{MOCK_BROKER_SUMMARY.total_rebate.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border bg-background p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Platform Profit</p>
          <p className="mt-1 text-base font-semibold">{MOCK_BROKER_SUMMARY.platform_profit.toLocaleString()}</p>
        </div>
      </section>

      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Recent Batches</h2>
          <button type="button" className="rounded-md border px-3 py-2 text-xs text-muted-foreground">
            Open in commissions
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Batch ID</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Records</th>
                <th className="py-2 pr-4 font-medium">Imported At</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_RECENT_BATCHES.map((row) => (
                <tr key={row.batch_id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{row.batch_id}</td>
                  <td className="py-2 pr-4">{row.status}</td>
                  <td className="py-2 pr-4">{row.records.toLocaleString()}</td>
                  <td className="py-2 pr-4">{new Date(row.imported_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

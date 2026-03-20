type CommissionBatchDetailPageProps = {
  params: Promise<{
    batch_id: string;
  }>;
};

export default async function CommissionBatchDetailPage({
  params,
}: CommissionBatchDetailPageProps) {
  const { batch_id } = await params;

  const batch = {
    id: batch_id,
    broker: "XM",
    importDate: "2026-03-20",
    status: "Completed",
    recordCount: 248,
    totalCommission: "$12,480.00",
  };

  const rows = [
    {
      account: "MT100001",
      client: "Alex Tan",
      amount: "$320.00",
      type: "Trader",
      status: "Completed",
    },
    {
      account: "MT100002",
      client: "Jason Lim",
      amount: "$180.00",
      type: "L1",
      status: "Completed",
    },
    {
      account: "MT100003",
      client: "Sarah Lee",
      amount: "$95.00",
      type: "L2",
      status: "Pending",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Commission Batch Detail</h1>
          <p className="text-sm text-muted-foreground">
            Review imported commission batch records.
          </p>
        </div>
        <button className="rounded-lg border px-4 py-2 text-sm">
          Export Batch
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs text-muted-foreground">Batch ID</p>
          <p className="mt-1 text-sm font-medium">{batch.id}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs text-muted-foreground">Broker</p>
          <p className="mt-1 text-sm font-medium">{batch.broker}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="mt-1 text-sm font-medium">{batch.status}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs text-muted-foreground">Import Date</p>
          <p className="mt-1 text-sm font-medium">{batch.importDate}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs text-muted-foreground">Record Count</p>
          <p className="mt-1 text-sm font-medium">{batch.recordCount}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs text-muted-foreground">Total Commission</p>
          <p className="mt-1 text-sm font-medium">{batch.totalCommission}</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-4 flex gap-3">
          <input
            className="w-64 rounded-lg border px-3 py-2 text-sm"
            placeholder="Search account or client..."
          />
          <select className="rounded-lg border px-3 py-2 text-sm">
            <option>All Types</option>
            <option>Trader</option>
            <option>L1</option>
            <option>L2</option>
          </select>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-3">Account</th>
              <th className="py-3">Client</th>
              <th className="py-3">Amount</th>
              <th className="py-3">Type</th>
              <th className="py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.account}-${row.client}`} className="border-b">
                <td className="py-3">{row.account}</td>
                <td className="py-3">{row.client}</td>
                <td className="py-3">{row.amount}</td>
                <td className="py-3">{row.type}</td>
                <td className="py-3">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

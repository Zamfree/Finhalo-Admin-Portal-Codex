export default function CommissionsPage() {
  const batches = [
    {
      batchId: "BAT-20260320-001",
      broker: "XM",
      importDate: "2026-03-20",
      recordCount: 248,
      status: "Completed",
      totalCommission: "$12,480.00",
    },
    {
      batchId: "BAT-20260319-002",
      broker: "Axi",
      importDate: "2026-03-19",
      recordCount: 186,
      status: "Processing",
      totalCommission: "$9,360.00",
    },
    {
      batchId: "BAT-20260318-003",
      broker: "Tickmill",
      importDate: "2026-03-18",
      recordCount: 132,
      status: "Pending",
      totalCommission: "$6,920.00",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Commissions</h1>
          <p className="text-sm text-muted-foreground">
            Review imported commission batches and processing status.
          </p>
        </div>
        <button className="rounded-lg border px-4 py-2 text-sm">
          Import Commission
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-4 flex gap-3">
          <input
            className="w-64 rounded-lg border px-3 py-2 text-sm"
            placeholder="Search batch ID or broker..."
          />
          <select className="rounded-lg border px-3 py-2 text-sm">
            <option>All Status</option>
            <option>Completed</option>
            <option>Processing</option>
            <option>Pending</option>
          </select>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-3">Batch ID</th>
              <th className="py-3">Broker</th>
              <th className="py-3">Import Date</th>
              <th className="py-3">Records</th>
              <th className="py-3">Total Commission</th>
              <th className="py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.batchId} className="border-b">
                <td className="py-3">{batch.batchId}</td>
                <td className="py-3">{batch.broker}</td>
                <td className="py-3">{batch.importDate}</td>
                <td className="py-3">{batch.recordCount}</td>
                <td className="py-3">{batch.totalCommission}</td>
                <td className="py-3">{batch.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

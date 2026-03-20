const MOCK_BROKERS = [
  {
    broker_id: "BRK-001",
    broker_name: "BrokerOne",
    status: "Active",
    total_commission: "$231,120.55",
    total_rebate: "$72,120.34",
    platform_profit: "$31,220.76",
  },
  {
    broker_id: "BRK-002",
    broker_name: "Prime Markets",
    status: "Active",
    total_commission: "$198,500.10",
    total_rebate: "$65,520.45",
    platform_profit: "$28,644.91",
  },
  {
    broker_id: "BRK-003",
    broker_name: "Vertex Trade",
    status: "Pending",
    total_commission: "$172,210.84",
    total_rebate: "$58,910.20",
    platform_profit: "$22,410.55",
  },
];

export default function BrokersPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Brokers</h1>
          <p className="text-sm text-muted-foreground">
            Review broker performance, status, and commission summary.
          </p>
        </div>
        <button className="rounded-lg border px-4 py-2 text-sm">
          Add Broker
        </button>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-4 flex gap-3">
          <input
            className="w-64 rounded-lg border px-3 py-2 text-sm"
            placeholder="Search broker..."
          />
          <select className="rounded-lg border px-3 py-2 text-sm">
            <option>All Status</option>
            <option>Active</option>
            <option>Pending</option>
          </select>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-3">Broker ID</th>
              <th className="py-3">Broker</th>
              <th className="py-3">Status</th>
              <th className="py-3">Commission</th>
              <th className="py-3">Rebate</th>
              <th className="py-3">Platform Profit</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_BROKERS.map((broker) => (
              <tr key={broker.broker_id} className="border-b">
                <td className="py-3">{broker.broker_id}</td>
                <td className="py-3">{broker.broker_name}</td>
                <td className="py-3">{broker.status}</td>
                <td className="py-3">{broker.total_commission}</td>
                <td className="py-3">{broker.total_rebate}</td>
                <td className="py-3">{broker.platform_profit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

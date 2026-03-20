const MOCK_IB_RANKING = [
  {
    ib_id: "IB-001",
    name: "IB Alpha",
    level: "Master IB",
    clients: 128,
    commission: "$18,240.00",
    status: "Active",
  },
  {
    ib_id: "IB-002",
    name: "IB Sigma",
    level: "Sub IB",
    clients: 96,
    commission: "$14,820.00",
    status: "Active",
  },
  {
    ib_id: "IB-003",
    name: "IB Nova",
    level: "Sub IB",
    clients: 74,
    commission: "$11,430.00",
    status: "Pending",
  },
];

const MOCK_RELATIONSHIPS = [
  { parent: "IB Alpha", child: "IB Sigma", depth: "L1" },
  { parent: "IB Alpha", child: "IB Nova", depth: "L1" },
  { parent: "IB Sigma", child: "Client Group A", depth: "L2" },
];

export default function IbNetworkPage() {
  const stats = [
    { label: "Total IBs", value: "42" },
    { label: "Active IBs", value: "35" },
    { label: "Sub IBs", value: "18" },
    { label: "Monthly Commission", value: "$86,420.00" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">IB Network</h1>
          <p className="text-sm text-muted-foreground">
            Review IB hierarchy, performance, and referral relationships.
          </p>
        </div>
        <button className="rounded-lg border px-4 py-2 text-sm">
          Add IB
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">IB Ranking</h2>
            <div className="flex gap-3">
              <input
                className="w-64 rounded-lg border px-3 py-2 text-sm"
                placeholder="Search IB..."
              />
              <select className="rounded-lg border px-3 py-2 text-sm">
                <option>All Status</option>
                <option>Active</option>
                <option>Pending</option>
              </select>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-3">IB ID</th>
                <th className="py-3">Name</th>
                <th className="py-3">Level</th>
                <th className="py-3">Clients</th>
                <th className="py-3">Commission</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_IB_RANKING.map((row) => (
                <tr key={row.ib_id} className="border-b">
                  <td className="py-3">{row.ib_id}</td>
                  <td className="py-3">{row.name}</td>
                  <td className="py-3">{row.level}</td>
                  <td className="py-3">{row.clients}</td>
                  <td className="py-3">{row.commission}</td>
                  <td className="py-3">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold">Relationship Map</h2>
          <div className="space-y-3">
            {MOCK_RELATIONSHIPS.map((item, index) => (
              <div key={`${item.parent}-${item.child}-${index}`} className="rounded-xl border p-3">
                <p className="text-sm font-medium">{item.parent}</p>
                <p className="text-xs text-muted-foreground">→ {item.child}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.depth}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

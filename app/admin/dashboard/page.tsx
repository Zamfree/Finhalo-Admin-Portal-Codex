const KPI_CARDS = [
  { label: "Total Users", value: "12,480", change: "+8.2%" },
  { label: "Total Commission", value: "$231,120.55", change: "+5.6%" },
  { label: "Total Rebates", value: "$72,120.34", change: "+4.1%" },
  { label: "Platform Profit", value: "$31,220.76", change: "+6.8%" },
];

const RECENT_ACTIVITY = [
  { id: "ACT-001", action: "Commission batch imported", time: "10 mins ago" },
  { id: "ACT-002", action: "New broker added", time: "35 mins ago" },
  { id: "ACT-003", action: "Support ticket escalated", time: "1 hour ago" },
  { id: "ACT-004", action: "Finance ledger exported", time: "2 hours ago" },
];

const TOP_IBS = [
  { name: "IB Alpha", clients: 128, commission: "$18,240.00" },
  { name: "IB Sigma", clients: 96, commission: "$14,820.00" },
  { name: "IB Nova", clients: 74, commission: "$11,430.00" },
];

export default function AdminDashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Platform overview, operational metrics, and recent activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {KPI_CARDS.map((card) => (
          <div key={card.label} className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.change}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <button className="rounded-lg border px-3 py-1.5 text-sm">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {RECENT_ACTIVITY.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.id}</p>
                </div>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Top IB Ranking</h2>
            <button className="rounded-lg border px-3 py-1.5 text-sm">
              Export
            </button>
          </div>

          <div className="space-y-3">
            {TOP_IBS.map((ib) => (
              <div key={ib.name} className="rounded-xl border p-3">
                <p className="text-sm font-medium">{ib.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Clients: {ib.clients}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Commission: {ib.commission}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

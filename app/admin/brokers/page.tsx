type BrokerStatsRow = {
  broker_name: string;
  total_commission: number;
  total_rebate: number;
  platform_profit: number;
};

const MOCK_BROKER_STATS: BrokerStatsRow[] = [
  { broker_name: "BrokerOne", total_commission: 231120.55, total_rebate: 72120.34, platform_profit: 31220.76 },
  { broker_name: "Prime Markets", total_commission: 198500.1, total_rebate: 65520.45, platform_profit: 28644.91 },
  { broker_name: "Vertex Trade", total_commission: 172210.84, total_rebate: 58910.2, platform_profit: 22410.55 },
];

function formatAmount(value: number) {
  return Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function BrokersPage() {
  const stats = MOCK_BROKER_STATS;

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h1 className="text-lg font-semibold">Broker Statistics</h1>
        <p className="mb-4 text-sm text-muted-foreground">Preview broker analytics with static sample data.</p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Broker Name</th>
                <th className="py-2 pr-4 font-medium">Total Commission</th>
                <th className="py-2 pr-4 font-medium">Total Rebate</th>
                <th className="py-2 pr-4 font-medium">Platform Profit</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((row) => (
                <tr key={row.broker_name} className="border-b last:border-0">
                  <td className="py-2 pr-4">{row.broker_name}</td>
                  <td className="py-2 pr-4">{formatAmount(row.total_commission)}</td>
                  <td className="py-2 pr-4">{formatAmount(row.total_rebate)}</td>
                  <td className="py-2 pr-4">{formatAmount(row.platform_profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

import { supabaseServer } from "@/lib/supabase/server";

type BrokerStatsRow = {
  broker_name: string;
  total_commission: number;
  total_rebate: number;
  platform_profit: number;
};

async function getBrokerStats() {
  const { data, error } = await supabaseServer
    .from("admin_broker_stats")
    .select("broker_name,total_commission,total_rebate,platform_profit")
    .order("platform_profit", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as BrokerStatsRow[] | null) ?? [];
}

function formatAmount(value: number) {
  return Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function BrokersPage() {
  const stats = await getBrokerStats();

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-background p-4 shadow-sm">
        <h1 className="mb-4 text-lg font-semibold">Broker Statistics</h1>

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

              {stats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                    No broker statistics found.
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

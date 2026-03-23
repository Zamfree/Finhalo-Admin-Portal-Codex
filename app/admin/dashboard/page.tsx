import { KpiCard } from "@/components/system/cards/kpi-card";
import { BarChart } from "@/components/system/charts/bar-chart";
import { LineChart } from "@/components/system/charts/line-chart";
import { IbRankingSection } from "@/components/system/data/ib-ranking-section";

type KpiOverviewRow = {
  total_users: number;
  total_commission: number;
  total_rebates: number;
  platform_profit: number;
};

type DailyMetricRow = {
  date: string;
  value: number;
};

type IbRankingRow = {
  ib_id: string;
  ib_name: string;
  total_rebate: number;
  trader_count: number;
};

function getDashboardData(): {
  kpi: KpiOverviewRow;
  commissionDaily: DailyMetricRow[];
  platformProfitDaily: DailyMetricRow[];
  ibRanking: IbRankingRow[];
} {
  return {
    kpi: {
      total_users: 1248,
      total_commission: 985430.22,
      total_rebates: 312505.88,
      platform_profit: 128644.12,
    },
    commissionDaily: [
      { date: "Mon", value: 20100 },
      { date: "Tue", value: 22450 },
      { date: "Wed", value: 24520 },
      { date: "Thu", value: 23180 },
      { date: "Fri", value: 26210 },
      { date: "Sat", value: 27100 },
    ],
    platformProfitDaily: [
      { date: "Mon", value: 5300 },
      { date: "Tue", value: 5450 },
      { date: "Wed", value: 6180 },
      { date: "Thu", value: 5920 },
      { date: "Fri", value: 6500 },
      { date: "Sat", value: 6890 },
    ],
    ibRanking: [
      { ib_id: "IB-1101", ib_name: "North Desk", total_rebate: 45200, trader_count: 41 },
      { ib_id: "IB-1164", ib_name: "Alpha Network", total_rebate: 39110, trader_count: 35 },
      { ib_id: "IB-1209", ib_name: "Zenith Group", total_rebate: 33890, trader_count: 29 },
    ],
  };
}

export default async function AdminDashboardPage() {
  const data = getDashboardData();
  const rankingRows: IbRankingRow[] = [
    { ib_id: "IB-1101", ib_name: "North Desk", total_rebate: 45200, trader_count: 41 },
    { ib_id: "IB-1164", ib_name: "Alpha Network", total_rebate: 39110, trader_count: 35 },
    { ib_id: "IB-1209", ib_name: "Zenith Group", total_rebate: 33890, trader_count: 29 },
  ];
  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Dashboard
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          Dashboard<span className="ml-1.5 inline-block text-emerald-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">
          Financial overview and operational metrics in preview mode.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: "Total Users",
            value: "1,248",
            change: "+8.2%",
          },
          {
            title: "Total Commission",
            value: "$985,430.22",
            change: "+5.6%",
          },
          {
            title: "Total Rebates",
            value: "$312,505.88",
            change: "+4.1%",
          },
          {
            title: "Platform Profit",
            value: "$128,644.12",
            change: "+6.8%",
          },
        ].map((item, i) => (
          <KpiCard key={i} title={item.title} value={item.value} change={item.change} />
        ))}
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LineChart title="Commission Trend" data={data.commissionDaily} />
        </div>
        <div className="lg:col-span-1">
          <BarChart title="Platform Profit" data={data.platformProfitDaily} />
        </div>
      </section>

      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Operational Snapshot</h2>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            Use the ranking table to review current IB performance alongside the top-level KPI and trend panels.
          </p>
        </div>
        <IbRankingSection rows={rankingRows} />
      </div>
    </div>
  );
}

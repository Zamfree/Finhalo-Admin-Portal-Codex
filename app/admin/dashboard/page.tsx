import { KpiCard } from "@/components/admin/kpi-card";
import { BarChart } from "@/components/charts/bar-chart";
import { LineChart } from "@/components/charts/line-chart";
import { IbRankingTable } from "@/components/tables/ib-ranking-table";

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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

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

  return (
    <div className="space-y-8 pb-8">
      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Overview
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl">
            Dashboard<span className="text-emerald-400">.</span>
          </h1>
          <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">
            Financial overview and operational metrics in preview mode.
          </p>
        </div>

        <button type="button" className="h-12 rounded-xl bg-emerald-500 px-6 text-sm font-bold uppercase tracking-[0.12em] text-black hover:bg-emerald-400">
          Quick Action
        </button>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Users" value={data.kpi.total_users.toLocaleString()} />
        <KpiCard label="Total Commission" value={formatCurrency(data.kpi.total_commission)} />
        <KpiCard label="Total Rebates" value={formatCurrency(data.kpi.total_rebates)} />
        <KpiCard label="Platform Profit" value={formatCurrency(data.kpi.platform_profit)} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <LineChart title="Commission Trend" data={data.commissionDaily} />
        <BarChart title="Platform Profit" data={data.platformProfitDaily} />
      </section>

      <IbRankingTable rows={data.ibRanking} />
    </div>
  );
}

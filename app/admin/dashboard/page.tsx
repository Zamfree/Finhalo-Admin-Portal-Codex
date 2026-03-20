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
      { date: "2026-03-14", value: 20100 },
      { date: "2026-03-15", value: 22450 },
      { date: "2026-03-16", value: 24520 },
      { date: "2026-03-17", value: 23180 },
      { date: "2026-03-18", value: 26210 },
      { date: "2026-03-19", value: 27100 },
    ],
    platformProfitDaily: [
      { date: "2026-03-14", value: 5300 },
      { date: "2026-03-15", value: 5450 },
      { date: "2026-03-16", value: 6180 },
      { date: "2026-03-17", value: 5920 },
      { date: "2026-03-18", value: 6500 },
      { date: "2026-03-19", value: 6890 },
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
    <div className="space-y-6">
      <section>
        <h1 className="text-lg font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Mock analytics preview for deployment and UI validation.</p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Users" value={data.kpi.total_users.toLocaleString()} />
        <KpiCard label="Total Commission" value={formatCurrency(data.kpi.total_commission)} />
        <KpiCard label="Total Rebates" value={formatCurrency(data.kpi.total_rebates)} />
        <KpiCard label="Platform Profit" value={formatCurrency(data.kpi.platform_profit)} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <LineChart title="Commission Trend" data={data.commissionDaily} />
        <BarChart title="Platform Profit" data={data.platformProfitDaily} />
      </section>

      <IbRankingTable rows={data.ibRanking} />
    </div>
  );
}

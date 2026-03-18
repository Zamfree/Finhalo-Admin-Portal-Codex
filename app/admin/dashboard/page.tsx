import { KpiCard } from "@/components/admin/kpi-card";
import { BarChart } from "@/components/charts/bar-chart";
import { LineChart } from "@/components/charts/line-chart";
import { IbRankingTable } from "@/components/tables/ib-ranking-table";
import { supabaseServer } from "@/lib/supabase/server";

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

async function getDashboardData() {
  const [kpiRes, commissionRes, profitRes, brokerStatsRes, ibRankingRes] = await Promise.all([
    supabaseServer
      .from("admin_kpi_overview")
      .select("total_users,total_commission,total_rebates,platform_profit")
      .single(),
    supabaseServer.from("admin_commission_daily").select("date,value"),
    supabaseServer.from("admin_platform_profit_daily").select("date,value"),
    supabaseServer.from("admin_broker_stats").select("*").limit(1),
    supabaseServer.from("admin_ib_ranking").select("ib_id,ib_name,total_rebate,trader_count"),
  ]);

  if (kpiRes.error) throw new Error(kpiRes.error.message);
  if (commissionRes.error) throw new Error(commissionRes.error.message);
  if (profitRes.error) throw new Error(profitRes.error.message);
  if (brokerStatsRes.error) throw new Error(brokerStatsRes.error.message);
  if (ibRankingRes.error) throw new Error(ibRankingRes.error.message);

  return {
    kpi: (kpiRes.data as KpiOverviewRow | null) ?? null,
    commissionDaily: (commissionRes.data as DailyMetricRow[] | null) ?? [],
    platformProfitDaily: (profitRes.data as DailyMetricRow[] | null) ?? [],
    ibRanking: (ibRankingRes.data as IbRankingRow[] | null) ?? [],
  };
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Users" value={data.kpi?.total_users?.toLocaleString() ?? "0"} />
        <KpiCard label="Total Commission" value={formatCurrency(data.kpi?.total_commission ?? 0)} />
        <KpiCard label="Total Rebates" value={formatCurrency(data.kpi?.total_rebates ?? 0)} />
        <KpiCard label="Platform Profit" value={formatCurrency(data.kpi?.platform_profit ?? 0)} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <LineChart title="Commission Trend" data={data.commissionDaily} />
        <BarChart title="Platform Profit" data={data.platformProfitDaily} />
      </section>

      <IbRankingTable rows={data.ibRanking} />
    </div>
  );
}

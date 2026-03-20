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

async function getDashboardData() {
  const [kpiRes, commissionRes, profitRes, ibRankingRes] = await Promise.all([
    supabaseServer
      .from("admin_kpi_overview")
      .select("total_users,total_commission,total_rebates,platform_profit")
      .maybeSingle(),
    supabaseServer.from("admin_commission_daily").select("date,value"),
    supabaseServer.from("admin_platform_profit_daily").select("date,value"),
    supabaseServer.from("admin_ib_ranking").select("ib_id,ib_name,total_rebate,trader_count"),
  ]);

  return {
    kpi: kpiRes.error ? null : ((kpiRes.data as KpiOverviewRow | null) ?? null),
    commissionDaily: commissionRes.error ? [] : ((commissionRes.data as DailyMetricRow[] | null) ?? []),
    platformProfitDaily: profitRes.error ? [] : ((profitRes.data as DailyMetricRow[] | null) ?? []),
    ibRanking: ibRankingRes.error ? [] : ((ibRankingRes.data as IbRankingRow[] | null) ?? []),
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

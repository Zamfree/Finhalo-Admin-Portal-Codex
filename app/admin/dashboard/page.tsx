import Link from "next/link";
import { KpiCard } from "@/components/admin/kpi-card";
import { BarChart } from "@/components/charts/bar-chart";
import { LineChart } from "@/components/charts/line-chart";
import { IbRankingTable } from "@/components/tables/ib-ranking-table";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();
  const [kpiRes, commissionRes, profitRes, ibRankingRes] = await Promise.all([
    supabase
      .from("admin_kpi_overview")
      .select("total_users,total_commission,total_rebates,platform_profit")
      .maybeSingle(),
    supabase.from("admin_commission_daily").select("date,value"),
    supabase.from("admin_platform_profit_daily").select("date,value"),
    supabase.from("admin_ib_ranking").select("ib_id,ib_name,total_rebate,trader_count"),
  ]);

  if (kpiRes.error) console.error("Error fetching KPI overview:", kpiRes.error);
  if (commissionRes.error) console.error("Error fetching commission trends:", commissionRes.error);
  if (profitRes.error) console.error("Error fetching profit trends:", profitRes.error);
  if (ibRankingRes.error) console.error("Error fetching IB ranking:", ibRankingRes.error);

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
        <Link href="/admin/users" className="block transition-transform hover:scale-[1.01] active:scale-[0.99]">
          <KpiCard
            label="Total Users"
            value={(data.kpi?.total_users ?? 0).toLocaleString()}
          />
        </Link>
        <Link href="/admin/commissions" className="block transition-transform hover:scale-[1.01] active:scale-[0.99]">
          <KpiCard
            label="Total Commission"
            value={formatCurrency(data.kpi?.total_commission ?? 0)}
          />
        </Link>
        <Link href="/admin/ib" className="block transition-transform hover:scale-[1.01] active:scale-[0.99]">
          <KpiCard
            label="Total Rebates"
            value={formatCurrency(data.kpi?.total_rebates ?? 0)}
          />
        </Link>
        <Link href="/admin/finance" className="block transition-transform hover:scale-[1.01] active:scale-[0.99]">
          <KpiCard
            label="Platform Profit"
            value={formatCurrency(data.kpi?.platform_profit ?? 0)}
          />
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-lg border bg-background p-4 shadow-sm">
          <LineChart title="Commission Trend" data={data.commissionDaily} />
        </div>
        <div className="rounded-lg border bg-background p-4 shadow-sm">
          <BarChart title="Platform Profit" data={data.platformProfitDaily} />
        </div>
      </section>

      <IbRankingTable rows={data.ibRanking} />
    </div>
  );
}

import Link from "next/link";

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

function createAdminHref(path: string, params?: Record<string, string | undefined>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value && value.trim().length > 0) {
      search.set(key, value);
    }
  }

  const query = search.toString();
  return query ? `${path}?${query}` : path;
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
  const data = await getDashboardData();

  const usersHref = createAdminHref("/admin/users");
  const commissionsHref = createAdminHref("/admin/commissions", { status: "approved" });
  const rebatesHref = createAdminHref("/admin/finance", { transaction_type: "rebate" });
  const profitHref = createAdminHref("/admin/finance", { transaction_type: "admin_fee" });

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link href={usersHref} className="block transform transition-transform hover:scale-[1.01]">
          <KpiCard label="Total Users" value={data.kpi?.total_users?.toLocaleString() ?? "0"} />
        </Link>
        <Link href={commissionsHref} className="block transform transition-transform hover:scale-[1.01]">
          <KpiCard label="Total Commission" value={formatCurrency(data.kpi?.total_commission ?? 0)} />
        </Link>
        <Link href={rebatesHref} className="block transform transition-transform hover:scale-[1.01]">
          <KpiCard label="Total Rebates" value={formatCurrency(data.kpi?.total_rebates ?? 0)} />
        </Link>
        <Link href={profitHref} className="block transform transition-transform hover:scale-[1.01]">
          <KpiCard label="Platform Profit" value={formatCurrency(data.kpi?.platform_profit ?? 0)} />
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="space-y-2">
          <div className="flex justify-end">
            <Link href={commissionsHref} className="text-xs text-primary hover:underline">
              View commission records
            </Link>
          </div>
          <LineChart title="Commission Trend" data={data.commissionDaily} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-end">
            <Link href={profitHref} className="text-xs text-primary hover:underline">
              View finance ledger
            </Link>
          </div>
          <BarChart title="Platform Profit" data={data.platformProfitDaily} />
        </div>
      </section>

      <IbRankingTable rows={data.ibRanking} />
    </div>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";

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

type DrillDownLinkProps = {
  href?: string;
  children: ReactNode;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function canUseRoute(href?: string): href is string {
  return typeof href === "string" && href.startsWith("/admin/") && href.trim().length > 0;
}

function DrillDownLink({ href, children }: DrillDownLinkProps) {
  if (!canUseRoute(href)) {
    return <>{children}</>;
  }

  return (
    <Link href={href} className="block">
      {children}
    </Link>
  );
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
    kpi: kpiRes.error ? null : ((kpiRes.data as KpiOverviewRow | null) ?? null),
    commissionDaily: commissionRes.error ? [] : ((commissionRes.data as DailyMetricRow[] | null) ?? []),
    platformProfitDaily: profitRes.error ? [] : ((profitRes.data as DailyMetricRow[] | null) ?? []),
    ibRanking: ibRankingRes.error ? [] : ((ibRankingRes.data as IbRankingRow[] | null) ?? []),
  };
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  const usersRoute = "/admin/users";
  const commissionsRoute = "/admin/commissions";
  const financeRoute = "/admin/finance";

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DrillDownLink href={usersRoute}>
          <KpiCard label="Total Users" value={data.kpi?.total_users?.toLocaleString() ?? "0"} />
        </DrillDownLink>
        <DrillDownLink href={commissionsRoute}>
          <KpiCard label="Total Commission" value={formatCurrency(data.kpi?.total_commission ?? 0)} />
        </DrillDownLink>
        <DrillDownLink href={financeRoute}>
          <KpiCard label="Total Rebates" value={formatCurrency(data.kpi?.total_rebates ?? 0)} />
        </DrillDownLink>
        <DrillDownLink href={financeRoute}>
          <KpiCard label="Platform Profit" value={formatCurrency(data.kpi?.platform_profit ?? 0)} />
        </DrillDownLink>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DrillDownLink href={commissionsRoute}>
          <LineChart title="Commission Trend" data={data.commissionDaily} />
        </DrillDownLink>
        <DrillDownLink href={financeRoute}>
          <BarChart title="Platform Profit" data={data.platformProfitDaily} />
        </DrillDownLink>
      </section>

      <IbRankingTable rows={data.ibRanking} />
    </div>
  );
}

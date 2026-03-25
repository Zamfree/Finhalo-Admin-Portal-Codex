import { KpiCard } from "@/components/system/cards/kpi-card";
import { BarChart } from "@/components/system/charts/bar-chart";
import { LineChart } from "@/components/system/charts/line-chart";
import { IbRankingSection } from "@/components/system/data/ib-ranking-section";

import { DASHBOARD_CHART_TITLES } from "./_config";
import { DASHBOARD_TITLE } from "./_constants";
import { mapDashboardKpis } from "./_mappers";
import { getDashboardData } from "./_mock-data";
import { DashboardSectionHeader } from "./_shared";

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  const kpiCards = mapDashboardKpis(data.kpi, data.previous_kpi);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Dashboard
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          {DASHBOARD_TITLE}
          <span className="ml-1.5 inline-block text-emerald-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">
          Financial overview and operational metrics in preview mode.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((item) => (
          <KpiCard key={item.label} title={item.label} value={item.value} change={item.change} />
        ))}
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LineChart title={DASHBOARD_CHART_TITLES.commissionTrend} data={data.commissionDaily} />
        </div>
        <div className="lg:col-span-1">
          <BarChart title={DASHBOARD_CHART_TITLES.platformProfit} data={data.platformProfitDaily} />
        </div>
      </section>

      <div className="space-y-3">
        <DashboardSectionHeader
          title={DASHBOARD_CHART_TITLES.ranking}
          description="Use the ranking table to review current IB performance alongside the top-level KPI and trend panels."
        />
        <IbRankingSection rows={data.ibRanking} />
      </div>
    </div>
  );
}

import { KpiCard } from "@/components/system/cards/kpi-card";
import { BarChart } from "@/components/system/charts/bar-chart";
import { LineChart } from "@/components/system/charts/line-chart";
import { DataPanel } from "@/components/system/data/data-panel";
import { IbRankingSection } from "@/components/system/data/ib-ranking-section";
import { PageHeader } from "@/components/system/layout/page-header";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";
import { getAdminDashboardData } from "@/services/admin/dashboard.service";
import { DASHBOARD_CHART_TITLES } from "./_config";
import { DASHBOARD_TITLE } from "./_constants";
import { mapDashboardKpis } from "./_mappers";
import { BrokerVolumeTable, LockedFundsPanel } from "./_shared";

export default async function AdminDashboardPage() {
  const { translations } = await getAdminServerPreferences();
  const t = translations.dashboard;
  const data = await getAdminDashboardData();
  const kpiCards = mapDashboardKpis(data.kpi, data.previous_kpi);

  return (
    <div className="space-y-5 pb-8 xl:space-y-6">
      <PageHeader
        eyebrow="Admin / Dashboard"
        title={t.title ?? DASHBOARD_TITLE}
        description={t.description}
        accentClassName="bg-emerald-400"
      />

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {kpiCards.map((item) => (
          <KpiCard
            key={item.label}
            title={item.label}
            value={String(item.value)}
            change={item.change}
          />
        ))}
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LineChart
            title={t.charts.commissionTrend ?? DASHBOARD_CHART_TITLES.commissionTrend}
            data={data.commissionDaily}
          />
        </div>
        <div className="lg:col-span-1">
          <BarChart
            title={t.charts.platformProfit ?? DASHBOARD_CHART_TITLES.platformProfit}
            data={data.platformProfitDaily}
          />
        </div>
      </section>

      <section>
        <LineChart title={DASHBOARD_CHART_TITLES.rebateTrend} data={data.rebateDaily} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <DataPanel
          title={
            <h2 className="text-xl font-semibold text-white">
              {DASHBOARD_CHART_TITLES.brokerVolume}
            </h2>
          }
          description={
            <p className="max-w-3xl text-sm text-zinc-400">
              Trading volume snapshot by broker for fast operational comparison across active
              account coverage.
            </p>
          }
        >
          <BrokerVolumeTable rows={data.brokerVolume} />
        </DataPanel>

        <div className="space-y-6">
          <IbRankingSection rows={data.ibRanking} />
          <LockedFundsPanel data={data.lockedFunds} />
        </div>
      </section>
    </div>
  );
}

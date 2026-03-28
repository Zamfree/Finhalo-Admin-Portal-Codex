import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";
import { getAdminFinanceHub } from "@/services/admin/finance.service";
import { getFinanceHubMetrics } from "./_mappers";
import { SummaryCard, formatAmount } from "./_shared";
import { FinanceRouteTabs } from "./finance-route-tabs";

export default async function FinanceOverviewPage() {
  const { translations } = await getAdminServerPreferences();
  const t = translations.finance;
  const data = await getAdminFinanceHub();
  const metrics = getFinanceHubMetrics(data);

  return (
    <div className="space-y-5 pb-8 xl:space-y-6">
      <PageHeader
        eyebrow="Admin / Finance"
        title={t.title}
        description={t.description}
        accentClassName="bg-teal-400"
      />

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label={t.totalLedgerAmount}
          value={formatAmount(metrics[0]?.value ?? 0, "neutral")}
          emphasis="strong"
          className="sm:col-span-2 xl:col-span-1"
        />
        <SummaryCard label={t.pendingWithdrawals} value={metrics[1]?.value ?? 0} />
        <SummaryCard
          label={t.adjustmentsThisMonth}
          value={formatAmount(metrics[2]?.value ?? 0, "neutral")}
        />
        <SummaryCard label={t.reconciliationAlerts} value={metrics[3]?.value ?? 0} />
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">{t.modulesTitle}</h2>}
        description={<p className="max-w-3xl text-sm text-zinc-400">{t.modulesDescription}</p>}
        tabs={
          <FinanceRouteTabs
            labels={{
              withdrawals: t.withdrawals,
              ledger: t.ledger,
              adjustments: t.adjustments,
              reconciliation: t.reconciliation,
            }}
          />
        }
      />
    </div>
  );
}

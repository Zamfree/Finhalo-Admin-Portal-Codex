import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import { ReturnToContextButton } from "@/components/system/navigation/return-to-context-button";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";
import { getAdminReconciliationRows } from "@/services/admin/finance.service";

import { getReconciliationSummaryMetrics } from "../_mappers";
import { SummaryCard, formatAmount } from "../_shared";
import { FinanceRouteTabs } from "../finance-route-tabs";
import { ReconciliationPageClient } from "./reconciliation-page-client";

export default async function ReconciliationPage() {
  const { translations } = await getAdminServerPreferences();
  const t = translations.finance;
  const rows = await getAdminReconciliationRows();
  const summary = getReconciliationSummaryMetrics(rows);
  const totalBrokerCommission = rows.reduce((sum, row) => sum + row.input_commission_total, 0);
  const totalUserRebate = rows.reduce((sum, row) => sum + row.rebate_total, 0);
  const totalPlatformProfit = rows.reduce((sum, row) => sum + row.platform_total, 0);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Admin / Reconciliation"
        title={t.reconciliation}
        description={t.modules.reconciliation}
        accentClassName="bg-teal-400"
        actions={
          <ReturnToContextButton
            fallbackPath="/admin/finance"
            label="Back to Finance"
            variant="ghost"
            className="h-11 px-5"
          />
        }
      />

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Reconciliation Alerts" value={summary[0]?.value ?? 0} emphasis="strong" />
        <SummaryCard label="Review Items" value={summary[1]?.value ?? 0} />
        <SummaryCard label="Matched" value={summary[2]?.value ?? 0} />
        <SummaryCard
          label="Net Difference"
          value={formatAmount(summary[3]?.value ?? 0, "neutral")}
        />
      </div>

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Broker Commission"
          value={formatAmount(totalBrokerCommission, "neutral")}
          emphasis="strong"
        />
        <SummaryCard label="User Rebate" value={formatAmount(totalUserRebate, "neutral")} />
        <SummaryCard label="Platform Profit" value={formatAmount(totalPlatformProfit, "neutral")} />
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Reconciliation Review</h2>}
        description={
          <p className="max-w-2xl text-sm text-zinc-400">
            Matched, review, and alert show the comparison state across commission, ledger, and payout totals.
          </p>
        }
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
        footer="Exception actions queue guarded review intent only. Final settlement mutation remains server-side."
      >
        <ReconciliationPageClient rows={rows} />
      </DataPanel>
    </div>
  );
}

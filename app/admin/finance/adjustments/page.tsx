import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import { ReturnToContextButton } from "@/components/system/navigation/return-to-context-button";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";
import { getAdminAdjustmentRows } from "@/services/admin/finance.service";

import { getAdjustmentSummaryMetrics } from "../_mappers";
import { SummaryCard, formatAmount } from "../_shared";
import { FinanceRouteTabs } from "../finance-route-tabs";
import { AdjustmentWorkflowActions } from "./adjustment-workflow-actions";
import { AdjustmentsPageClient } from "./adjustments-page-client";

export default async function AdjustmentsPage() {
  const { translations } = await getAdminServerPreferences();
  const t = translations.finance;
  const rows = await getAdminAdjustmentRows();
  const summary = getAdjustmentSummaryMetrics(rows);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Admin / Adjustments"
        title={t.adjustments}
        description={t.modules.adjustments}
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
        <SummaryCard
          label={t.adjustmentsThisMonth}
          value={formatAmount(summary[0]?.value ?? 0, "neutral")}
          emphasis="strong"
        />
        <SummaryCard label="Entries" value={summary[1]?.value ?? 0} />
        <SummaryCard label="Credits" value={summary[2]?.value ?? 0} />
        <SummaryCard label="Debits" value={summary[3]?.value ?? 0} />
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Balance Adjustments</h2>}
        description={
          <p className="max-w-2xl text-sm text-zinc-400">
            Post single or batch balance adjustments as explicit ledger entries.
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
        footer="All adjustment mutations post into finance_ledger and remain traceable in ledger detail."
      >
        <div className="space-y-5">
          <AdjustmentWorkflowActions />
          <AdjustmentsPageClient rows={rows} />
        </div>
      </DataPanel>
    </div>
  );
}

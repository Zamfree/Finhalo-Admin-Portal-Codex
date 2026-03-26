import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import { getAdminReconciliationRows } from "@/services/admin/finance.service";

import { getReconciliationSummaryMetrics } from "../_mappers";
import { SummaryCard, formatAmount } from "../_shared";
import { ReconciliationPageClient } from "./reconciliation-page-client";

export default async function ReconciliationPage() {
  const rows = await getAdminReconciliationRows();
  const summary = getReconciliationSummaryMetrics(rows);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Admin / Reconciliation"
        title="Reconciliation"
        description="Compare commission, ledger, and payout totals in one review surface."
        accentClassName="bg-teal-400"
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

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Reconciliation Review</h2>}
        description={
          <p className="max-w-2xl text-sm text-zinc-400">
            Matched, review, and alert show the comparison state across commission, ledger, and payout totals.
          </p>
        }
      >
        <ReconciliationPageClient rows={rows} />
      </DataPanel>
    </div>
  );
}

import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import { getAdminAdjustmentRows } from "@/services/admin/finance.service";

import { getAdjustmentSummaryMetrics } from "../_mappers";
import { SummaryCard, formatAmount } from "../_shared";
import { AdjustmentsPageClient } from "./adjustments-page-client";

export default async function AdjustmentsPage() {
  const rows = await getAdminAdjustmentRows();
  const summary = getAdjustmentSummaryMetrics(rows);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Admin / Adjustments"
        title="Adjustments"
        description="Manual balance adjustments for guarded finance handling."
        accentClassName="bg-teal-400"
      />

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Adjustments This Month"
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
            Credits and debits reflect recorded adjustment direction only.
          </p>
        }
        actions={
          <div className="flex gap-2">
            <AdminButton variant="primary" className="h-11 px-5">
              Create Adjustment
            </AdminButton>
            <AdminButton variant="secondary" className="h-11 px-5">
              Batch Adjustment
            </AdminButton>
          </div>
        }
      >
        <AdjustmentsPageClient rows={rows} />
      </DataPanel>
    </div>
  );
}

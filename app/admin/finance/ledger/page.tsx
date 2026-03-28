import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import { ReturnToContextButton } from "@/components/system/navigation/return-to-context-button";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";
import { getAdminLedgerRows } from "@/services/admin/finance.service";

import { getLedgerSummaryMetrics } from "../_mappers";
import { SummaryCard, formatAmount } from "../_shared";
import { FinanceRouteTabs } from "../finance-route-tabs";
import { LedgerPageClient } from "./ledger-page-client";

type LedgerPageProps = {
  searchParams: Promise<{
    ledger_ref?: string;
    rebate_record_id?: string;
    account_id?: string;
  }>;
};

export default async function LedgerPage({ searchParams }: LedgerPageProps) {
  const { translations } = await getAdminServerPreferences();
  const t = translations.finance;
  const { ledger_ref, rebate_record_id, account_id } = await searchParams;
  const rows = await getAdminLedgerRows();
  const summary = getLedgerSummaryMetrics(rows);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Admin / Ledger"
        title={t.ledger}
        description={t.ledgerDescription}
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

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">{t.ledgerPanelTitle}</h2>}
        description={
          <p className="max-w-2xl text-sm text-zinc-400">{t.ledgerPanelDescription}</p>
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
        summary={
          <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label={t.totalLedgerAmount}
              value={formatAmount(summary[0]?.value ?? 0, "neutral")}
              emphasis="strong"
            />
            <SummaryCard label={t.postedEntries} value={summary[1]?.value ?? 0} />
            <SummaryCard label={t.pendingEntries} value={summary[2]?.value ?? 0} />
            <SummaryCard label={t.reversedEntries} value={summary[3]?.value ?? 0} />
          </div>
        }
        footer={t.ledgerFooter}
      >
        <LedgerPageClient
          rows={rows}
          ledgerRefFilter={ledger_ref}
          rebateRecordIdFilter={rebate_record_id}
          accountIdFilter={account_id}
        />
      </DataPanel>
    </div>
  );
}

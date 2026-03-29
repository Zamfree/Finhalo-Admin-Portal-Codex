import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import { ReturnToContextButton } from "@/components/system/navigation/return-to-context-button";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";
import { getAdminLedgerViewerPage } from "@/services/admin/finance.service";
import type { LedgerViewerFilters } from "../_types";

import { getLedgerSummaryMetrics } from "../_mappers";
import { SummaryCard, formatAmount } from "../_shared";
import { FinanceRouteTabs } from "../finance-route-tabs";
import { LedgerPageClient } from "./ledger-page-client";

type LedgerPageProps = {
  searchParams: Promise<{
    query?: string;
    user_id?: string;
    ledger_ref?: string;
    rebate_record_id?: string;
    account_id?: string;
    transaction_type?: string;
    direction?: string;
    status?: string;
    reference_type?: string;
    reference_id?: string;
    batch_id?: string;
    date_from?: string;
    date_to?: string;
    page?: string;
  }>;
};

function parsePageParam(value?: string) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function normalizeLedgerViewerFilters(params: Awaited<LedgerPageProps["searchParams"]>): LedgerViewerFilters {
  return {
    query: params.query?.trim() ?? "",
    user_id: params.user_id?.trim() ?? "",
    account_id: params.account_id?.trim() ?? "",
    transaction_type: params.transaction_type?.trim() ?? "",
    direction: params.direction === "credit" || params.direction === "debit" ? params.direction : "all",
    status:
      params.status === "posted" || params.status === "pending" || params.status === "reversed"
        ? params.status
        : "all",
    reference_type: params.reference_type?.trim() ?? "",
    reference_id: params.reference_id?.trim() ?? "",
    batch_id: params.batch_id?.trim() ?? "",
    ledger_ref: params.ledger_ref?.trim() ?? "",
    rebate_record_id: params.rebate_record_id?.trim() ?? "",
    date_from: params.date_from?.trim() ?? "",
    date_to: params.date_to?.trim() ?? "",
  };
}

export default async function LedgerPage({ searchParams }: LedgerPageProps) {
  const { translations } = await getAdminServerPreferences();
  const t = translations.finance;
  const params = await searchParams;
  const filters = normalizeLedgerViewerFilters(params);
  const page = parsePageParam(params.page);
  const ledgerPage = await getAdminLedgerViewerPage({
    filters,
    page,
  });
  const summary = getLedgerSummaryMetrics(ledgerPage.rows);

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
          rows={ledgerPage.rows}
          pagination={ledgerPage.pagination}
          ledgerRefFilter={filters.ledger_ref}
          rebateRecordIdFilter={filters.rebate_record_id}
          accountIdFilter={filters.account_id}
        />
      </DataPanel>
    </div>
  );
}

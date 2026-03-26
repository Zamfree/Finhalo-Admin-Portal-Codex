import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import { ReturnToContextButton } from "@/components/system/navigation/return-to-context-button";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";
import { getAdminWithdrawalRows } from "@/services/admin/finance.service";

import { getWithdrawalSummaryMetrics } from "../_mappers";
import { SummaryCard, formatAmount } from "../_shared";
import { WithdrawalsPageClient } from "./withdrawals-page-client";

type WithdrawalsPageProps = {
  searchParams: Promise<{
    account_id?: string;
  }>;
};

export default async function WithdrawalsPage({ searchParams }: WithdrawalsPageProps) {
  const { translations } = await getAdminServerPreferences();
  const t = translations.finance;
  const { account_id } = await searchParams;
  const rows = await getAdminWithdrawalRows();
  const summary = getWithdrawalSummaryMetrics(rows);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Admin / Withdrawals"
        title={t.withdrawals}
        description={t.withdrawalsDescription}
        accentClassName="bg-teal-300"
        actions={
          <ReturnToContextButton
            fallbackPath="/admin/finance"
            label="Back to Finance"
            variant="ghost"
            className="px-3 py-2"
          />
        }
      />

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">{t.withdrawalPanelTitle}</h2>}
        description={
          <div className="max-w-2xl space-y-2 text-sm text-zinc-400">
            <p>{t.withdrawalPanelDescription}</p>
            <p className="text-zinc-500">{t.withdrawalPanelNote}</p>
          </div>
        }
        actions={
          <div className="flex gap-2">
            <AdminButton variant="secondary" className="h-11 px-5">
              {translations.common.actions.batchApprove}
            </AdminButton>
            <AdminButton variant="destructive" className="h-11 px-5">
              {translations.common.actions.batchReject}
            </AdminButton>
          </div>
        }
        summary={
          <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label={t.pendingWithdrawals}
              value={summary[0]?.value ?? 0}
              emphasis="strong"
            />
            <SummaryCard
              label={t.approvalVolume}
              value={formatAmount(summary[1]?.value ?? 0, "neutral")}
            />
            <SummaryCard
              label={t.gasFees}
              value={formatAmount(summary[2]?.value ?? 0, "neutral")}
            />
            <SummaryCard label={t.rejected} value={summary[3]?.value ?? 0} />
          </div>
        }
      >
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {t.gasFeeConfiguration}
            </span>
            <span className="text-sm tabular-nums text-zinc-300">
              {t.defaultFee} {formatAmount(4.5, "neutral")}
            </span>
            <span className="text-sm text-zinc-400">{t.networkLabel} TRC20</span>
            <span className="text-sm text-zinc-500">{t.updatedLabel} 2026-03-23</span>
            <AdminButton variant="secondary" className="ml-auto h-10 px-4">
              {translations.common.actions.updatePlaceholder}
            </AdminButton>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {t.placeholderOnly}
          </p>
        </div>
        <WithdrawalsPageClient rows={rows} accountIdFilter={account_id} />
      </DataPanel>
    </div>
  );
}

import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import { ReturnToContextButton } from "@/components/system/navigation/return-to-context-button";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";
import { getAdminWithdrawalRows } from "@/services/admin/finance.service";

import { getWithdrawalSummaryMetrics } from "../_mappers";
import { SummaryCard, formatAmount } from "../_shared";
import { FinanceRouteTabs } from "../finance-route-tabs";
import { WithdrawalsOperationsBar } from "./withdrawals-operations-bar";
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
  const pendingRows = rows.filter((row) => row.status === "pending");
  const defaultFee = pendingRows[0]?.fee ?? 4.5;
  const defaultNetwork = pendingRows[0]?.network ?? "TRC20";
  const networkOptions = Array.from(
    new Set(
      rows
        .map((row) => row.network.trim())
        .filter((network) => network.length > 0)
    )
  );

  if (!networkOptions.includes(defaultNetwork)) {
    networkOptions.push(defaultNetwork);
  }

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
        actions={
          <AdminButton variant="ghost" className="h-11 px-5" disabled>
            {pendingRows.length} Pending
          </AdminButton>
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
        <WithdrawalsOperationsBar
          networkOptions={networkOptions}
          defaultNetwork={defaultNetwork}
          defaultFee={defaultFee}
          batchApproveLabel={translations.common.actions.batchApprove}
          batchRejectLabel={translations.common.actions.batchReject}
          updateLabel={translations.common.actions.updatePlaceholder}
        />
        <WithdrawalsPageClient rows={rows} accountIdFilter={account_id} />
      </DataPanel>
    </div>
  );
}

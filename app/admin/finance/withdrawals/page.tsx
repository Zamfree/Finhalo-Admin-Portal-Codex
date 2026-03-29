import Link from "next/link";
import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import { ReturnToContextButton } from "@/components/system/navigation/return-to-context-button";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";
import { getAdminWithdrawalRows } from "@/services/admin/finance.service";

import { getWithdrawalSummaryMetrics } from "../_mappers";
import { SummaryCard, formatAmount } from "../_shared";
import { FinanceRouteTabs } from "../finance-route-tabs";
import { WithdrawalsPageClient } from "./withdrawals-page-client";

type WithdrawalsPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function WithdrawalsPage({ searchParams }: WithdrawalsPageProps) {
  const { status } = await searchParams;
  const activeStatus = status ?? "all";
  const { translations } = await getAdminServerPreferences();
  const t = translations.finance;
  const rows = await getAdminWithdrawalRows();
  const summary = getWithdrawalSummaryMetrics(rows);
  const requestedCount = rows.filter((row) => row.status === "requested").length;
  const reviewCount = rows.filter((row) => row.status === "under_review").length;
  const approvedCount = rows.filter((row) => row.status === "approved").length;
  const processingCount = rows.filter((row) => row.status === "processing").length;

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
            <p className="text-zinc-500">
              Withdrawal transitions are server-side only and ledger-linked with idempotent business references.
            </p>
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
          <div className="flex flex-wrap items-center gap-2">
            <QueueFilterShortcut
              href="/admin/finance/withdrawals"
              label="All"
              count={rows.length}
              active={activeStatus === "all"}
            />
            <QueueFilterShortcut
              href="/admin/finance/withdrawals?status=requested"
              label="Requested"
              count={requestedCount}
              active={activeStatus === "requested"}
            />
            <QueueFilterShortcut
              href="/admin/finance/withdrawals?status=under_review"
              label="Review"
              count={reviewCount}
              active={activeStatus === "under_review"}
            />
            <QueueFilterShortcut
              href="/admin/finance/withdrawals?status=approved"
              label="Approved"
              count={approvedCount}
              active={activeStatus === "approved"}
            />
            <QueueFilterShortcut
              href="/admin/finance/withdrawals?status=processing"
              label="Processing"
              count={processingCount}
              active={activeStatus === "processing"}
            />
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
              value={formatAmount(summary[2]?.value ?? 0, "negative")}
            />
            <SummaryCard label={t.rejected} value={summary[3]?.value ?? 0} />
          </div>
        }
      >
        <WithdrawalsPageClient rows={rows} />
      </DataPanel>
    </div>
  );
}

function QueueFilterShortcut({
  href,
  label,
  count,
  active = false,
}: {
  href: string;
  label: string;
  count: number;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`admin-interactive inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-[10px] font-semibold uppercase tracking-[0.12em] ${
        active
          ? "border-sky-300/35 bg-sky-500/10 text-sky-200"
          : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-sky-300/30 hover:text-sky-200"
      }`}
    >
      <span>{label}</span>
      <span
        className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${
          active
            ? "border-sky-300/35 bg-sky-500/10 text-sky-100"
            : "border-white/10 bg-white/[0.04] text-zinc-400"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}

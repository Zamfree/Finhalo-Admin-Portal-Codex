import Link from "next/link";
import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";
import { getAdminFinanceHub } from "@/services/admin/finance.service";
import { getFinanceHubMetrics, getFinanceOperationalStages } from "./_mappers";
import { FinanceWorkflowCard, SummaryCard, formatAmount } from "./_shared";

const NAV_ITEMS = [
  {
    href: "/admin/finance/withdrawals",
    key: "withdrawals",
  },
  {
    href: "/admin/finance/ledger",
    key: "ledger",
  },
  {
    href: "/admin/finance/adjustments",
    key: "adjustments",
  },
  {
    href: "/admin/finance/reconciliation",
    key: "reconciliation",
  },
];

export default async function FinanceOverviewPage() {
  const { translations } = await getAdminServerPreferences();
  const t = translations.finance;
  const data = await getAdminFinanceHub();
  const metrics = getFinanceHubMetrics(data);
  const stages = getFinanceOperationalStages(data);

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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)] xl:items-start">
        <DataPanel
          title={<h2 className="text-xl font-semibold text-white">Finance Operations</h2>}
          description={
            <p className="max-w-3xl text-sm text-zinc-400">
              Keep finance work grounded in the ledger, move payouts through guarded review, and preserve a clear reconciliation loop.
            </p>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            {stages.map((stage) => (
              <FinanceWorkflowCard key={stage.key} stage={stage} />
            ))}
          </div>
        </DataPanel>

        <DataPanel
          title={<h2 className="text-xl font-semibold text-white">{t.modulesTitle}</h2>}
          description={<p className="max-w-2xl text-sm text-zinc-400">{t.modulesDescription}</p>}
        >
          <div className="grid gap-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="admin-surface-soft rounded-2xl p-5 transition hover:border-white/10 hover:bg-white/[0.04]"
              >
                <p className="text-lg font-semibold text-white">{t[item.key as keyof typeof t] as string}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {t.modules[item.key as keyof typeof t.modules]}
                </p>
              </Link>
            ))}
          </div>
        </DataPanel>
      </div>
    </div>
  );
}

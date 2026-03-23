import Link from "next/link";

import { DataPanel } from "@/components/system/data/data-panel";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";

import { SummaryCard, formatAmount } from "./_shared";

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

  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Finance
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          {t.title}<span className="ml-1.5 inline-block text-teal-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">{t.description}</p>
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">{t.modulesTitle}</h2>}
        description={
          <p className="max-w-2xl text-sm text-zinc-400">{t.modulesDescription}</p>
        }
        summary={
          <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label={t.totalLedgerAmount}
              value={formatAmount(284560.32, "neutral")}
              emphasis="strong"
            />
            <SummaryCard label={t.pendingWithdrawals} value={12} />
            <SummaryCard
              label={t.adjustmentsThisMonth}
              value={formatAmount(4820.5, "neutral")}
            />
            <SummaryCard label={t.reconciliationAlerts} value={3} />
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
  );
}

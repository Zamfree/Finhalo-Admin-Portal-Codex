import { DataPanel } from "@/components/system/data/data-panel";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";
import { SummaryCard } from "./_shared";
import { AccountsPageClient } from "./accounts-page-client";
import { getAdminAccounts } from "@/services/admin/accounts.service";

export default async function AccountsPage() {
  const { translations } = await getAdminServerPreferences();
  const t = translations.account;
  const rows = await getAdminAccounts();
  const totalAccounts = rows.length;
  const activeAccounts = rows.filter((row) => row.status === "active").length;
  const accountsWithL2 = rows.filter((row) => row.l2_ib_id).length;
  const brokersCovered = new Set(rows.map((row) => row.broker)).size;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Accounts
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          {t.title}<span className="ml-1.5 inline-block text-cyan-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">
          {t.description}
        </p>
      </div>

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label={t.totalAccounts} value={totalAccounts} emphasis="strong" />
        <SummaryCard label={t.activeAccounts} value={activeAccounts} />
        <SummaryCard label={t.accountsWithL2} value={accountsWithL2} />
        <SummaryCard label={t.brokersCovered} value={brokersCovered} />
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">{t.directoryTitle}</h2>}
        description={
          <p className="max-w-3xl text-sm text-zinc-400">{t.directoryDescription}</p>
        }
      >
        <AccountsPageClient rows={rows} />
      </DataPanel>
    </div>
  );
}

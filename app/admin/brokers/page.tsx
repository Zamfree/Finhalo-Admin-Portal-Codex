import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import { getAdminBrokers } from "@/services/admin/brokers.service";
import { SummaryCard } from "./_shared";
import { BrokersPageClient } from "./brokers-page-client";
import { getBrokerSummaryStats } from "./_mappers";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";

export default async function BrokersPage() {
  const { translations } = await getAdminServerPreferences();
  const t = translations.brokers;
  const workspace = await getAdminBrokers();
  const summary = getBrokerSummaryStats(workspace.rows);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Admin / Brokers"
        title={t.title}
        description={t.description}
        accentClassName="bg-sky-400"
      />
      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label={t.totalBrokers} value={summary.totalBrokers} emphasis="strong" />
        <SummaryCard label={t.activeBrokers} value={summary.activeBrokers} />
        <SummaryCard label={t.inactiveBrokers} value={summary.inactiveBrokers} />
        <SummaryCard label={t.totalLinkedAccounts} value={summary.totalLinkedAccounts} />
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">{t.directoryTitle}</h2>}
        description={<p className="max-w-3xl text-sm text-zinc-400">{t.directoryDescription}</p>}
      >
        <BrokersPageClient rows={workspace.rows} />
      </DataPanel>
    </div>
  );
}

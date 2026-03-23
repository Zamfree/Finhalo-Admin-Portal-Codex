import { DataPanel } from "@/components/system/data/data-panel";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";

import { MOCK_CAMPAIGNS } from "./_mock-data";
import { CampaignPageClient } from "./campaign-page-client";

function SummaryCard({
  label,
  value,
  emphasis = "default",
}: {
  label: string;
  value: number;
  emphasis?: "default" | "strong";
}) {
  return (
    <div className="admin-surface-soft rounded-2xl p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className={`mt-2 text-xl font-semibold tabular-nums ${emphasis === "strong" ? "text-white" : "text-zinc-200"}`}>
        {value}
      </p>
    </div>
  );
}

export default async function CampaignPage() {
  const { translations } = await getAdminServerPreferences();
  const t = translations.campaign;

  const totalCampaigns = MOCK_CAMPAIGNS.length;
  const activeCampaigns = MOCK_CAMPAIGNS.filter((row) => row.status === "active").length;
  const scheduledCampaigns = MOCK_CAMPAIGNS.filter((row) => row.status === "scheduled").length;
  const totalParticipants = MOCK_CAMPAIGNS.reduce((sum, row) => sum + row.participants, 0);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Campaigns
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          {t.title}<span className="ml-1.5 inline-block text-fuchsia-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">{t.description}</p>
      </div>

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label={t.totalCampaigns} value={totalCampaigns} emphasis="strong" />
        <SummaryCard label={t.activeCampaigns} value={activeCampaigns} />
        <SummaryCard label={t.scheduledCampaigns} value={scheduledCampaigns} />
        <SummaryCard label={t.totalParticipants} value={totalParticipants} />
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">{t.listTitle}</h2>}
        description={<p className="max-w-3xl text-sm text-zinc-400">{t.listDescription}</p>}
      >
        <CampaignPageClient rows={MOCK_CAMPAIGNS} />
      </DataPanel>
    </div>
  );
}

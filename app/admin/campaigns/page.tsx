import { DataPanel } from "@/components/system/data/data-panel";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";
import { getAdminCampaigns } from "@/services/admin/campaigns.service";

import { CampaignsPageClient } from "./campaigns-page-client";
import { CampaignSummaryCard } from "./_shared";

export default async function CampaignsPage() {
  const { translations } = await getAdminServerPreferences();
  const t = translations.campaign;
  const rows = await getAdminCampaigns();

  const totalCampaigns = rows.length;
  const activeCampaigns = rows.filter((row) => row.status === "active").length;
  const scheduledCampaigns = rows.filter((row) => row.status === "scheduled").length;
  const totalParticipants = rows.reduce((sum, row) => sum + row.participants, 0);

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
        <CampaignSummaryCard label={t.totalCampaigns} value={totalCampaigns} emphasis="strong" />
        <CampaignSummaryCard label={t.activeCampaigns} value={activeCampaigns} />
        <CampaignSummaryCard label={t.scheduledCampaigns} value={scheduledCampaigns} />
        <CampaignSummaryCard label={t.totalParticipants} value={totalParticipants} />
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">{t.listTitle}</h2>}
        description={<p className="max-w-3xl text-sm text-zinc-400">{t.listDescription}</p>}
      >
        <CampaignsPageClient rows={rows} />
      </DataPanel>
    </div>
  );
}

import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
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
    <div className="space-y-5 pb-8 xl:space-y-6">
      <PageHeader
        eyebrow="Admin / Campaigns"
        title={t.title}
        description={t.description}
        accentClassName="bg-fuchsia-400"
      />

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

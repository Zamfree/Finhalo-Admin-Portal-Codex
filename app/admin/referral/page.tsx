import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";
import { getAdminReferralWorkspace } from "@/services/admin/referral.service";

import { ReferralPageClient } from "./referral-page-client";
import { ReferralSummaryCard } from "./_shared";

export default async function ReferralPage() {
  const { translations } = await getAdminServerPreferences();
  const t = translations.referral;
  const rows = await getAdminReferralWorkspace();

  const activePrograms = rows.filter((row) => row.status === "active").length;
  const scheduledPrograms = rows.filter((row) => row.status === "scheduled").length;
  const totalParticipants = rows.reduce((sum, row) => sum + row.participants, 0);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Admin / Referral"
        title={t.title}
        description={t.description}
        accentClassName="bg-rose-400"
      />

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <ReferralSummaryCard label="Total Programs" value={rows.length} emphasis="strong" />
        <ReferralSummaryCard label="Active Programs" value={activePrograms} />
        <ReferralSummaryCard label="Scheduled Programs" value={scheduledPrograms} />
        <ReferralSummaryCard label="Participants" value={totalParticipants} />
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">{t.listTitle}</h2>}
        description={<p className="max-w-3xl text-sm text-zinc-400">{t.listDescription}</p>}
      >
        <ReferralPageClient rows={rows} />
      </DataPanel>
    </div>
  );
}

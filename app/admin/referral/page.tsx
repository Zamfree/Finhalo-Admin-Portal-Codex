import { DataPanel } from "@/components/system/data/data-panel";
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
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Referral
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          {t.title}<span className="ml-1.5 inline-block text-rose-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">{t.description}</p>
      </div>

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

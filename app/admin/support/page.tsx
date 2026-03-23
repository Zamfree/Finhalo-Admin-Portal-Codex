import { DataPanel } from "@/components/system/data/data-panel";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";

import { MOCK_SUPPORT_TICKETS } from "./_mock-data";
import { SummaryCard } from "./_shared";
import { SupportPageClient } from "./support-page-client";

export default async function SupportPage() {
  const { translations } = await getAdminServerPreferences();
  const t = translations.support;
  const totalTickets = MOCK_SUPPORT_TICKETS.length;
  const openTickets = MOCK_SUPPORT_TICKETS.filter((row) => row.status === "open").length;
  const inProgressTickets = MOCK_SUPPORT_TICKETS.filter((row) => row.status === "in_progress").length;
  const resolvedTickets = MOCK_SUPPORT_TICKETS.filter((row) => row.status === "resolved").length;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Support
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          {t.title}<span className="ml-1.5 inline-block text-violet-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">{t.description}</p>
      </div>

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label={t.totalTickets} value={totalTickets} emphasis="strong" />
        <SummaryCard label={t.openTickets} value={openTickets} />
        <SummaryCard label={t.inProgress} value={inProgressTickets} />
        <SummaryCard label={t.resolved} value={resolvedTickets} />
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">{t.queueTitle}</h2>}
        description={
          <p className="max-w-3xl text-sm text-zinc-400">{t.queueDescription}</p>
        }
      >
        <SupportPageClient rows={MOCK_SUPPORT_TICKETS} />
      </DataPanel>
    </div>
  );
}

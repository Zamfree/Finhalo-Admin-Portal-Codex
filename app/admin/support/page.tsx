import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";
import { getSupportSummaryMetrics } from "./_mappers";
import { SummaryCard } from "./_shared";
import { SupportWorkbenchClient } from "./support-workbench-client";
import { getAdminSupportWorkspace } from "@/services/admin/support.service";

export default async function SupportPage() {
  const { translations } = await getAdminServerPreferences();
  const t = translations.support;
  const workspace = await getAdminSupportWorkspace();
  const summary = getSupportSummaryMetrics(workspace.tickets);

  return (
    <div className="space-y-5 pb-8 xl:space-y-6">
      <PageHeader
        eyebrow="Admin / Support"
        title={t.title}
        description={t.description}
        accentClassName="bg-violet-400"
      />

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label={t.totalTickets} value={summary[0]?.value ?? 0} emphasis="strong" />
        <SummaryCard label={t.openTickets} value={summary[1]?.value ?? 0} />
        <SummaryCard label={t.inProgress} value={summary[2]?.value ?? 0} />
        <SummaryCard label={t.resolved} value={summary[3]?.value ?? 0} />
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Support Workbench</h2>}
        description={
          <p className="max-w-3xl text-sm text-zinc-400">
            Switch between queue operations and broadcast actions without leaving Support.
          </p>
        }
      >
        <SupportWorkbenchClient
          rows={workspace.tickets}
          timelineByTicket={workspace.timelineByTicket}
          announcements={workspace.announcements}
          outboundMessages={workspace.outboundMessages}
        />
      </DataPanel>
    </div>
  );
}

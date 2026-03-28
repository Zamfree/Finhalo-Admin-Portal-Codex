import { AdminButton } from "@/components/system/actions/admin-button";
import { PageHeader } from "@/components/system/layout/page-header";
import { ReturnContextLink } from "@/components/system/navigation/return-context-link";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";
import {
  getAdminCommissionQueueWorkspace,
  getAdminCommissionWorkspace,
} from "@/services/admin/commission.service";

import { CommissionPageClient } from "./commission-page-client";
import { formatAmount, SummaryCard } from "./_shared";

export default async function CommissionPage() {
  const { translations } = await getAdminServerPreferences();
  const t = translations.commission;
  const [queueWorkspace, workspace] = await Promise.all([
    getAdminCommissionQueueWorkspace(),
    getAdminCommissionWorkspace(),
  ]);

  return (
    <div className="space-y-5 pb-8 xl:space-y-6">
      <PageHeader
        eyebrow="Admin / Commission"
        title={t.title}
        description="Batch queue for commission review and posting."
        accentClassName="bg-amber-400"
        actions={
          <ReturnContextLink href="/admin/commission/upload">
            <AdminButton variant="secondary" className="h-11 px-5">
              Upload Commission
            </AdminButton>
          </ReturnContextLink>
        }
      />

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))_minmax(0,1.1fr)]">
        <SummaryCard
          label="Needs Attention"
          value={queueWorkspace.reviewQueue}
          emphasis="strong"
          className="sm:col-span-2 xl:col-span-1"
        />
        <SummaryCard label="Ready to Post" value={queueWorkspace.readyQueue} />
        <SummaryCard label="Finalized" value={queueWorkspace.finalizedQueue} />
        <SummaryCard
          label={t.summary.totalGross}
          value={formatAmount(queueWorkspace.totalGrossCommission, "neutral")}
        />
      </div>

      <CommissionPageClient
        queueWorkspace={queueWorkspace}
        commissionRecords={workspace.commissionRecords}
      />
    </div>
  );
}

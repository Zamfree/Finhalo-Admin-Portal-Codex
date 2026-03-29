import { redirect } from "next/navigation";
import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import { ReturnContextLink } from "@/components/system/navigation/return-context-link";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";
import {
  getAdminCommissionQueueWorkspace,
  getAdminCommissionWorkspace,
} from "@/services/admin/commission.service";

import { CommissionPageClient } from "./commission-page-client";
import { formatAmount, SummaryCard } from "./_shared";

type CommissionPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function CommissionPage({ searchParams }: CommissionPageProps) {
  const params = searchParams ? await searchParams : {};
  const query = firstParam(params.query).trim();
  const accountId = firstParam(params.account_id).trim();
  const userId = firstParam(params.user_id).trim();
  const broker = firstParam(params.broker).trim();
  const brokerId = firstParam(params.broker_id).trim();

  const needsAliasRewrite =
    ((!query && accountId.length > 0) ||
      (!query && userId.length > 0) ||
      (!broker && brokerId.length > 0));

  if (needsAliasRewrite) {
    const nextParams = new URLSearchParams();

    for (const [key, rawValue] of Object.entries(params)) {
      if (rawValue === undefined) {
        continue;
      }

      const values = Array.isArray(rawValue) ? rawValue : [rawValue];
      for (const value of values) {
        if (value === undefined || value === "") {
          continue;
        }
        nextParams.append(key, value);
      }
    }

    if (!query && accountId) {
      nextParams.set("query", accountId);
      nextParams.delete("account_id");
    } else if (!query && userId) {
      nextParams.set("query", userId);
      nextParams.delete("user_id");
    }

    if (!broker && brokerId) {
      nextParams.set("broker", brokerId);
      nextParams.delete("broker_id");
    }

    redirect(`/admin/commission${nextParams.toString() ? `?${nextParams.toString()}` : ""}`);
  }

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

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Needs Attention"
          value={queueWorkspace.reviewQueue}
          emphasis="strong"
        />
        <SummaryCard label="Ready to Post" value={queueWorkspace.readyQueue} />
        <SummaryCard label="Finalized" value={queueWorkspace.finalizedQueue} />
        <SummaryCard
          label={t.summary.totalGross}
          value={formatAmount(queueWorkspace.totalGrossCommission, "neutral")}
        />
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Commission Workbench</h2>}
        description={
          <p className="max-w-3xl text-sm text-zinc-400">
            Switch between the batch queue and records view without leaving commission operations.
          </p>
        }
      >
        <CommissionPageClient
          queueWorkspace={queueWorkspace}
          commissionRecords={workspace.commissionRecords}
        />
      </DataPanel>
    </div>
  );
}

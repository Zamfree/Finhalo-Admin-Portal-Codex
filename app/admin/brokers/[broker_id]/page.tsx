import type { ReactNode } from "react";

import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import { ReturnContextLink } from "@/components/system/navigation/return-context-link";
import { ReturnToContextButton } from "@/components/system/navigation/return-to-context-button";
import { getAdminBrokerDetail } from "@/services/admin/brokers.service";

import {
  BrokerAccountTypeCoveragePanel,
  BrokerCommissionConfigPanel,
  BrokerDetailMetrics,
  BrokerImportConfigPanel,
  BrokerMappingRulesPanel,
  BrokerRecentBatchesPanel,
} from "./_shared";

type BrokerDetailProps = {
  params: Promise<{
    broker_id: string;
  }>;
};

export default async function BrokerDetailPage({ params }: BrokerDetailProps) {
  const { broker_id } = await params;
  const detail = await getAdminBrokerDetail(broker_id);
  const latestBatch = detail.recentBatches[0] ?? null;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Admin / Brokers"
        title={broker_id}
        description="Review broker operations, import posture, and commission setup before moving into batch-level investigation."
        accentClassName="bg-sky-400"
        actions={
          <ReturnToContextButton
            fallbackPath="/admin/brokers"
            label="Back to Brokers"
            variant="ghost"
            className="px-3 py-2"
          />
        }
      />

      <BrokerDetailMetrics brokerId={detail.brokerId} summary={detail.summary} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)]">
        <BrokerRecentBatchesPanel rows={detail.recentBatches} />

        <div className="space-y-6">
          <DataPanel
            title={<h2 className="text-xl font-semibold text-white">Broker Overview</h2>}
            description={
              <p className="max-w-2xl break-words text-sm text-zinc-400">
                Review the broker identifier, current batch posture, and finance-facing totals before moving into batch-level record review.
              </p>
            }
          >
            <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <DetailField label="Broker ID" value={detail.brokerId} mono />
              <DetailField label="Active Batches" value={detail.summary.active_batches} />
              <DetailField label="Latest Batch" value={latestBatch?.batch_id ?? "—"} mono />
              <DetailField label="Latest Status" value={latestBatch?.status ?? "—"} className="capitalize" />
            </dl>
          </DataPanel>

          <BrokerImportConfigPanel config={detail.importConfig} />
          <BrokerCommissionConfigPanel config={detail.commissionConfig} />

          <DataPanel
            title={<h2 className="text-xl font-semibold text-white">Navigation / Handoff</h2>}
            description={
              <p className="max-w-2xl break-words text-sm text-zinc-400">
                Move into commission batches when operational review is needed, or return to the broker directory for broader portfolio comparison.
              </p>
            }
          >
            <div className="flex flex-wrap gap-3">
              <ReturnToContextButton
                fallbackPath="/admin/brokers"
                label="Back to Brokers"
                variant="secondary"
                className="h-11 px-5"
              />
              <ReturnContextLink href="/admin/commission/batches">
                <AdminButton variant="primary" className="h-11 px-5">
                  Open Commission Batches
                </AdminButton>
              </ReturnContextLink>
            </div>
          </DataPanel>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <BrokerMappingRulesPanel rows={detail.mappingRules} />
        <BrokerAccountTypeCoveragePanel rows={detail.accountTypeCoverage} />
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
  mono = false,
  className,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</dt>
      <dd
        className={`mt-2 min-w-0 ${mono ? "break-all font-mono text-zinc-200" : "break-words text-zinc-200"} ${
          className ?? ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

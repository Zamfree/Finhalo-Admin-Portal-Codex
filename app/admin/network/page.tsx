import { redirect } from "next/navigation";
import { DataPanel } from "@/components/system/data/data-panel";
import { SummaryCard } from "@/components/system/cards/summary-card";
import { PageHeader } from "@/components/system/layout/page-header";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";
import {
  getAdminNetworkNodeRebateContextMap,
  getAdminNetworkSnapshots,
} from "@/services/admin/network.service";
import { buildNetworkWorkspace } from "./_mappers";
import { NetworkPageClient } from "./network-page-client";

type NetworkPageProps = {
  searchParams: Promise<{
    detail_account_id?: string;
    snapshot_id?: string;
    ib_user_id?: string;
    returnTo?: string;
    source?: string;
  }>;
};

export default async function NetworkPage({ searchParams }: NetworkPageProps) {
  const { translations } = await getAdminServerPreferences();
  const t = translations.network;
  const { detail_account_id, snapshot_id, returnTo, source } = await searchParams;
  const snapshots = await getAdminNetworkSnapshots();
  const nodeRebateContextMap = await getAdminNetworkNodeRebateContextMap(snapshots);
  const workspace = buildNetworkWorkspace(snapshots, nodeRebateContextMap);

  const snapshotMatch = snapshot_id
    ? snapshots.find((snapshot) => snapshot.snapshotId === snapshot_id)
    : null;
  const accountIdForRedirect = snapshotMatch?.accountId ?? detail_account_id;

  if (accountIdForRedirect) {
    const params = new URLSearchParams();
    if (snapshot_id) {
      params.set("snapshot_id", snapshot_id);
    }
    if (returnTo) {
      params.set("returnTo", returnTo);
    }
    if (source) {
      params.set("source", source);
    }

    const nextUrl = params.toString()
      ? `/admin/accounts/${encodeURIComponent(accountIdForRedirect)}?${params.toString()}`
      : `/admin/accounts/${encodeURIComponent(accountIdForRedirect)}`;

    redirect(nextUrl);
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Admin / Network"
        title={t.title}
        description={t.description}
        accentClassName="bg-indigo-400"
      />

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Nodes" value={workspace.summary.totalNodes} emphasis="strong" />
        <SummaryCard label="Active IBs" value={workspace.summary.activeIbs} />
        <SummaryCard label="Total Downlines" value={workspace.summary.totalDownlines} />
        <SummaryCard label="Active Traders" value={workspace.summary.activeTraders} />
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">{t.explorerTitle}</h2>}
        description={<p className="max-w-3xl">{t.explorerDescription}</p>}
      >
        <NetworkPageClient
          snapshots={snapshots}
          nodeRebateContextEntries={Array.from(nodeRebateContextMap.entries())}
        />
      </DataPanel>
    </div>
  );
}

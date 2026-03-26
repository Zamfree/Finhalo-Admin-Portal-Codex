import { redirect } from "next/navigation";
import { DataPanel } from "@/components/system/data/data-panel";
import { PageHeader } from "@/components/system/layout/page-header";
import { ReturnToContextButton } from "@/components/system/navigation/return-to-context-button";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";
import { getAdminNetworkSnapshots } from "@/services/admin/network.service";
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
        description="Relationship-centric view of current referral and IB nodes, their uplinks, their direct referrals, and a small set of business activity signals."
        accentClassName="bg-indigo-400"
        actions={
          <ReturnToContextButton
            fallbackPath="/admin/network"
            label="Back to Network"
            variant="ghost"
            className="h-11 px-5"
          />
        }
      />

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Relationship Nodes</h2>}
        description={
          <p className="max-w-3xl text-sm text-zinc-400">
            One row equals one network node. Use the table to scan structure quickly, then open the
            drawer to understand position, downline, and linked module context.
          </p>
        }
      >
        <NetworkPageClient snapshots={snapshots} />
      </DataPanel>
    </div>
  );
}

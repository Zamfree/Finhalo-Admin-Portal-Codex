import { redirect } from "next/navigation";

import { DataPanel } from "@/components/system/data/data-panel";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";

import { MOCK_ACCOUNT_NETWORK_DETAILS, MOCK_ACCOUNT_NETWORK_SNAPSHOTS } from "./_mock-data";
import { NetworkIbPageClient } from "./ib/network-ib-page-client";

type NetworkPageProps = {
  searchParams: Promise<{
    detail_account_id?: string;
    snapshot_id?: string;
    ib_user_id?: string;
  }>;
};

export default async function NetworkPage({ searchParams }: NetworkPageProps) {
  const { translations } = await getAdminServerPreferences();
  const t = translations.network;
  const { detail_account_id, snapshot_id, ib_user_id } = await searchParams;

  const snapshotMatch = snapshot_id
    ? MOCK_ACCOUNT_NETWORK_SNAPSHOTS.find((snapshot) => snapshot.id === snapshot_id)
    : null;
  const accountIdForRedirect = snapshotMatch?.accountId ?? detail_account_id;

  if (accountIdForRedirect) {
    const params = new URLSearchParams();
    if (snapshot_id) {
      params.set("snapshot_id", snapshot_id);
    }

    const nextUrl = params.toString()
      ? `/admin/accounts/${encodeURIComponent(accountIdForRedirect)}?${params.toString()}`
      : `/admin/accounts/${encodeURIComponent(accountIdForRedirect)}`;

    redirect(nextUrl);
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Network
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          {t.title}<span className="ml-1.5 inline-block text-indigo-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">{t.description}</p>
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">{t.explorerTitle}</h2>}
        description={
          <p className="max-w-3xl text-sm text-zinc-400">{t.explorerDescription}</p>
        }
      >
        <NetworkIbPageClient snapshots={MOCK_ACCOUNT_NETWORK_DETAILS} initialIbUserId={ib_user_id} />
      </DataPanel>
    </div>
  );
}

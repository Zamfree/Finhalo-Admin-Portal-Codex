import { notFound } from "next/navigation";

import { DataPanel } from "@/components/system/data/data-panel";

import { MOCK_CAMPAIGNS } from "../_mock-data";

export default function CampaignDetailPage({
  params,
}: {
  params: { campaign_id: string };
}) {
  const campaign = MOCK_CAMPAIGNS.find((item) => item.campaign_id === params.campaign_id);

  if (!campaign) notFound();

  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Campaigns
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          {campaign.name}<span className="ml-1.5 inline-block text-fuchsia-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">{campaign.overview}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <DataPanel title="Overview">
          <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Campaign ID</dt>
              <dd className="mt-2 font-mono text-zinc-300">{campaign.campaign_id}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Status</dt>
              <dd className="mt-2 text-zinc-300">{campaign.status}</dd>
            </div>
          </dl>
        </DataPanel>
        <DataPanel title="Performance">
          <p className="text-2xl font-semibold text-white">{campaign.participants}</p>
          <p className="mt-2 text-sm text-zinc-400">{campaign.performance_summary}</p>
        </DataPanel>
      </div>
    </div>
  );
}

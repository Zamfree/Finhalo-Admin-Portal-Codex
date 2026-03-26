import { DataPanel } from "@/components/system/data/data-panel";
import type { CampaignRecord } from "../_types";

export function CampaignOverviewTab({ campaign }: { campaign: CampaignRecord }) {
  return (
    <DataPanel
      title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Overview</h3>}
    >
      <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <div className="space-y-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Campaign Name</dt>
          <dd className="text-sm font-medium text-white">{campaign.name}</dd>
        </div>
        <div className="space-y-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Type</dt>
          <dd className="text-sm text-zinc-300">{campaign.type}</dd>
        </div>
        <div className="space-y-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Status</dt>
          <dd className="text-sm text-zinc-300">{campaign.status}</dd>
        </div>
        <div className="space-y-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Reward Type</dt>
          <dd className="text-sm text-zinc-300">{campaign.reward_type}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm text-zinc-400">{campaign.overview}</p>
    </DataPanel>
  );
}

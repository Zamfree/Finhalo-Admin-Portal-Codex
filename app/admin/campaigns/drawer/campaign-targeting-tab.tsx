import { DataPanel } from "@/components/system/data/data-panel";
import type { CampaignRecord } from "../_types";

export function CampaignTargetingTab({ campaign }: { campaign: CampaignRecord }) {
  return (
    <DataPanel
      title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Targeting</h3>}
    >
      <p className="text-sm text-zinc-300">{campaign.targeting_summary}</p>
    </DataPanel>
  );
}

import { DataPanel } from "@/components/system/data/data-panel";

import type { CampaignRecord } from "../_types";

export function CampaignRulesTab({ campaign }: { campaign: CampaignRecord }) {
  return (
    <DataPanel
      title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Rules</h3>}
    >
      <ul className="space-y-3 text-sm text-zinc-300">
        {campaign.rules.map((rule) => (
          <li key={rule} className="rounded-xl bg-white/[0.03] px-4 py-3">
            {rule}
          </li>
        ))}
      </ul>
    </DataPanel>
  );
}

import { DataPanel } from "@/components/system/data/data-panel";
import type { ReferralRecord } from "../_types";

export function ReferralOverviewTab({ referral }: { referral: ReferralRecord }) {
  return (
    <DataPanel
      title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Overview</h3>}
    >
      <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <div className="space-y-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Referral ID</dt>
          <dd className="font-mono text-sm text-zinc-300">{referral.referral_id}</dd>
        </div>
        <div className="space-y-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Program Name</dt>
          <dd className="text-sm text-white">{referral.name}</dd>
        </div>
        <div className="space-y-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Status</dt>
          <dd className="text-sm text-zinc-300">{referral.status}</dd>
        </div>
        <div className="space-y-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Reward Model</dt>
          <dd className="text-sm text-zinc-300">{referral.reward_model}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm text-zinc-400">{referral.overview}</p>
    </DataPanel>
  );
}

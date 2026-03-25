import { DataPanel } from "@/components/system/data/data-panel";

import type { ReferralRecord } from "../_types";

export function ReferralPerformanceTab({ referral }: { referral: ReferralRecord }) {
  return (
    <DataPanel
      title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Performance</h3>}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="admin-surface-soft rounded-xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Participants
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{referral.participants}</p>
        </div>
        <div className="admin-surface-soft rounded-xl p-4 md:col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Performance Summary
          </p>
          <p className="mt-2 text-sm text-zinc-300">{referral.performance_summary}</p>
        </div>
      </div>
    </DataPanel>
  );
}

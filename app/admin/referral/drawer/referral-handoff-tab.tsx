import Link from "next/link";
import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { getReferralOperationalPosture } from "../_mappers";
import type { ReferralRecord } from "../_types";

export function ReferralHandoffTab({ referral }: { referral: ReferralRecord }) {
  const posture = getReferralOperationalPosture(referral);

  return (
    <div className="space-y-4">
      <DataPanel
        title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Handoff</h3>}
        description={<p className="text-sm text-zinc-400">{posture.nextAction}</p>}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="admin-surface-soft rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Current Stage
            </p>
            <p className="mt-2 text-sm font-medium text-white">{posture.stageLabel}</p>
          </div>
          <div className="admin-surface-soft rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Recommended Module
            </p>
            <p className="mt-2 text-sm font-medium text-white">{posture.linkedModuleLabel}</p>
          </div>
          <div className="admin-surface-soft rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Review Note
            </p>
            <p className="mt-2 text-sm text-zinc-300">{posture.reviewNote}</p>
          </div>
        </div>
      </DataPanel>

      <DataPanel>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/campaigns">
            <AdminButton variant="secondary">View Campaigns</AdminButton>
          </Link>
          <Link href="/admin/finance">
            <AdminButton variant="ghost">View Finance</AdminButton>
          </Link>
          <Link href="/admin/settings">
            <AdminButton variant="ghost">View Settings</AdminButton>
          </Link>
        </div>
      </DataPanel>
    </div>
  );
}

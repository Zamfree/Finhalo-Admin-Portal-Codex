import Link from "next/link";

import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";

export function ReferralHandoffTab() {
  return (
    <DataPanel
      title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Handoff</h3>}
    >
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/campaigns">
          <AdminButton variant="secondary">View Campaigns</AdminButton>
        </Link>
        <Link href="/admin/settings">
          <AdminButton variant="ghost">View Settings</AdminButton>
        </Link>
      </div>
    </DataPanel>
  );
}

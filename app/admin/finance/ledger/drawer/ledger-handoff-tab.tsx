import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { ReturnContextLink } from "@/components/system/navigation/return-context-link";
import type { LedgerRow } from "../../_types";

export function LedgerHandoffTab({ entry }: { entry: LedgerRow }) {
  return (
    <DataPanel
      title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Handoff</h3>}
      description={<p className="text-sm text-zinc-400">Use account, commission, and finance views as the record-centric drilldown path.</p>}
    >
      <div className="flex flex-wrap gap-3">
        <ReturnContextLink href={`/admin/accounts/${entry.account_id}`}>
          <AdminButton variant="ghost">View Account</AdminButton>
        </ReturnContextLink>
        <ReturnContextLink
          href="/admin/network"
          query={{
            detail_account_id: entry.account_id,
            tab: "overview",
            snapshot_id: entry.relationship_snapshot_id ?? undefined,
          }}
        >
          <AdminButton variant="ghost">View Network Snapshot</AdminButton>
        </ReturnContextLink>
        <ReturnContextLink
          href="/admin/commission"
          query={{ account_id: entry.account_id }}
        >
          <AdminButton variant="secondary">View Commission</AdminButton>
        </ReturnContextLink>
      </div>
    </DataPanel>
  );
}

import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { ReturnContextLink } from "@/components/system/navigation/return-context-link";
import type { WithdrawalRow } from "../../_types";
import { WithdrawalWorkflowActions } from "../withdrawal-workflow-actions";

export function WithdrawalHandoffTab({ withdrawal }: { withdrawal: WithdrawalRow }) {
  return (
    <DataPanel
      title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Handoff</h3>}
      description={<p className="text-sm text-zinc-400">Keep approval actions local and use linked modules only when deeper record context is needed.</p>}
    >
      <div className="flex flex-wrap gap-3">
        <ReturnContextLink href={`/admin/accounts/${withdrawal.account_id}`}>
          <AdminButton variant="ghost">View Account</AdminButton>
        </ReturnContextLink>
        <ReturnContextLink
          href="/admin/network"
          query={{
            detail_account_id: withdrawal.account_id,
            tab: "overview",
            snapshot_id: withdrawal.relationship_snapshot_id ?? undefined,
          }}
        >
          <AdminButton variant="ghost">View Network Snapshot</AdminButton>
        </ReturnContextLink>
        <ReturnContextLink
          href="/admin/commission"
          query={{ account_id: withdrawal.account_id }}
        >
          <AdminButton variant="secondary">View Commission</AdminButton>
        </ReturnContextLink>
      </div>
      <div className="mt-4">
        <WithdrawalWorkflowActions
          withdrawalId={withdrawal.withdrawal_id}
          status={withdrawal.status}
          compact
        />
      </div>
    </DataPanel>
  );
}

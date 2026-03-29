import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";
import { ReturnContextLink } from "@/components/system/navigation/return-context-link";
import type { LedgerRow } from "../../_types";

function resolveBatchId(entry: LedgerRow) {
  if (entry.source_batch_id) {
    return entry.source_batch_id;
  }

  if (entry.reference_type !== "commission_batch_approval" || !entry.reference_id) {
    return null;
  }

  const [batchId] = entry.reference_id.split(":");
  return batchId || null;
}

export function LedgerHandoffTab({ entry }: { entry: LedgerRow }) {
  const batchId = resolveBatchId(entry);
  const hasAccount = entry.account_id && entry.account_id !== "-";

  return (
    <DataPanel
      title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Handoff</h3>}
      description={
        <p className="text-sm text-zinc-400">
          Use linked operational modules to audit the source event behind this ledger entry.
        </p>
      }
    >
      <div className="flex flex-wrap gap-3">
        {entry.user_id ? (
          <ReturnContextLink href={`/admin/users/${entry.user_id}`}>
            <AdminButton variant="ghost">View User</AdminButton>
          </ReturnContextLink>
        ) : null}

        {hasAccount ? (
          <ReturnContextLink href={`/admin/accounts/${entry.account_id}`}>
            <AdminButton variant="ghost">View Account</AdminButton>
          </ReturnContextLink>
        ) : null}

        {batchId ? (
          <ReturnContextLink href={`/admin/commission/batches/${batchId}`}>
            <AdminButton variant="secondary">View Batch</AdminButton>
          </ReturnContextLink>
        ) : null}

        {entry.source_commission_id ? (
          <ReturnContextLink href="/admin/commission" query={{ query: entry.source_commission_id }}>
            <AdminButton variant="ghost">View Commission Row</AdminButton>
          </ReturnContextLink>
        ) : null}

        {entry.related_withdrawal_id ? (
          <ReturnContextLink href="/admin/finance/withdrawals" query={{ query: entry.related_withdrawal_id }}>
            <AdminButton variant="ghost">View Withdrawal</AdminButton>
          </ReturnContextLink>
        ) : null}

        {entry.related_rebate_record ? (
          <ReturnContextLink href="/admin/finance/ledger" query={{ rebate_record_id: entry.related_rebate_record }}>
            <AdminButton variant="ghost">Trace Rebate Linkage</AdminButton>
          </ReturnContextLink>
        ) : null}

        {hasAccount ? (
          <ReturnContextLink
            href="/admin/network"
            query={{
              detail_account_id: entry.account_id,
              snapshot_id: entry.relationship_snapshot_id ?? undefined,
            }}
          >
            <AdminButton variant="ghost">View Network Snapshot</AdminButton>
          </ReturnContextLink>
        ) : null}
      </div>
    </DataPanel>
  );
}

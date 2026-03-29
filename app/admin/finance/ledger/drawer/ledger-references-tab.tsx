import type { ReactNode } from "react";

import { DataPanel } from "@/components/system/data/data-panel";
import type { LedgerRow } from "../../_types";

function formatJson(value: Record<string, unknown> | null | undefined) {
  if (!value) {
    return null;
  }

  return JSON.stringify(value, null, 2);
}

export function LedgerReferencesTab({ entry }: { entry: LedgerRow }) {
  const allocationSnapshot = formatJson(entry.allocation_snapshot);
  const rawRecord = formatJson(entry.raw_record);

  return (
    <DataPanel
      title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">References</h3>}
    >
      <div className="space-y-4">
        <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <DetailItem label="Normalized Transaction Type" value={entry.transaction_type} />
          <DetailItem label="Raw Transaction Type" value={entry.raw_transaction_type ?? "-"} />
          <DetailItem label="Reference Type" value={entry.reference_type ?? "-"} />
          <DetailItem label="Reference ID" value={entry.reference_id ?? "-"} mono />
          <DetailItem label="Source Batch ID" value={entry.source_batch_id ?? "-"} mono />
          <DetailItem label="Source Commission ID" value={entry.source_commission_id ?? "-"} mono />
          <DetailItem label="Related Rebate Record" value={entry.related_rebate_record ?? "-"} mono />
          <DetailItem label="Related Withdrawal ID" value={entry.related_withdrawal_id ?? "-"} mono />
          <DetailItem label="Relationship Snapshot ID" value={entry.relationship_snapshot_id ?? "-"} mono />
          <DetailItem label="Ledger Ref" value={entry.ledger_ref} mono />
        </dl>

        {allocationSnapshot ? (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Allocation Snapshot JSON
            </p>
            <pre className="admin-surface-soft max-h-56 overflow-auto rounded-xl p-3 text-xs text-zinc-300">
              {allocationSnapshot}
            </pre>
          </div>
        ) : null}

        {rawRecord ? (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Raw Ledger Row JSON</p>
            <pre className="admin-surface-soft max-h-56 overflow-auto rounded-xl p-3 text-xs text-zinc-300">
              {rawRecord}
            </pre>
          </div>
        ) : null}
      </div>
    </DataPanel>
  );
}

function DetailItem({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="space-y-2">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</dt>
      <dd className={mono ? "break-all font-mono text-sm text-zinc-300" : "break-words text-sm text-zinc-300"}>
        {value}
      </dd>
    </div>
  );
}

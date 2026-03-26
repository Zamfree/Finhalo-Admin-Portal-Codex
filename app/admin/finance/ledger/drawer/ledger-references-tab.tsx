import { DataPanel } from "@/components/system/data/data-panel";
import type { LedgerRow } from "../../_types";

export function LedgerReferencesTab({ entry }: { entry: LedgerRow }) {
  return (
    <DataPanel
      title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">References</h3>}
    >
      <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
        <DetailItem label="Related Rebate Record" value={entry.related_rebate_record ?? "—"} mono />
        <DetailItem label="Account ID" value={entry.account_id} mono />
        <DetailItem label="Relationship Snapshot ID" value={entry.relationship_snapshot_id ?? "—"} mono />
      </dl>
    </DataPanel>
  );
}

function DetailItem({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="space-y-2">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</dt>
      <dd className={mono ? "font-mono text-sm text-zinc-300" : "text-sm text-zinc-300"}>{value}</dd>
    </div>
  );
}

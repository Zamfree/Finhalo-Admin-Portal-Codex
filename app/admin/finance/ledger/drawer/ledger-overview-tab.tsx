import type { ReactNode } from "react";

import { DataPanel } from "@/components/system/data/data-panel";
import type { LedgerRow } from "../../_types";

export function LedgerOverviewTab({ entry }: { entry: LedgerRow }) {
  return (
    <DataPanel
      title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Overview</h3>}
    >
      <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <DetailItem label="Ledger Ref" value={entry.ledger_ref} mono />
        <DetailItem label="Entry Type" value={entry.entry_type} />
        <DetailItem label="Direction" value={entry.direction} />
        <DetailItem label="Created At" value={new Date(entry.created_at).toLocaleString()} />
      </dl>
    </DataPanel>
  );
}

function DetailItem({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0 space-y-2">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</dt>
      <dd
        className={mono ? "min-w-0 break-all font-mono text-sm text-zinc-300" : "min-w-0 break-words text-sm text-zinc-300"}
      >
        {value}
      </dd>
    </div>
  );
}

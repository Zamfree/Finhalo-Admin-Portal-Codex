import { DataPanel } from "@/components/system/data/data-panel";
import { SummaryCard, formatAmount } from "../../_shared";
import type { LedgerRow } from "../../_types";

export function LedgerContextTab({ entry }: { entry: LedgerRow }) {
  return (
    <DataPanel
      title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Context</h3>}
    >
      <div className="space-y-4">
        <SummaryCard
          label="Recorded Amount"
          value={formatAmount(entry.amount, entry.direction === "credit" ? "positive" : "negative")}
          emphasis="strong"
        />
        <p className="text-sm text-zinc-400">
          This finance entry traces to the relationship snapshot bound to the originating
          commission / rebate records.
        </p>
        <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <DetailItem label="Beneficiary" value={entry.beneficiary} />
          <DetailItem label="Account ID" value={entry.account_id} mono />
          <DetailItem label="Status" value={entry.status} />
          <DetailItem
            label="Relationship Chain"
            value={`${entry.trader_user_id} -> ${entry.l1_ib_id ?? "—"} -> ${entry.l2_ib_id ?? "—"}`}
          />
        </dl>
      </div>
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

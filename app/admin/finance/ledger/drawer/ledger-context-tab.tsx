import type { ReactNode } from "react";

import { DataPanel } from "@/components/system/data/data-panel";
import { SummaryCard, formatAmount } from "../../_shared";
import type { LedgerRow } from "../../_types";

function formatSnapshotValue(value: unknown): ReactNode {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return formatAmount(value, "neutral");
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

export function LedgerContextTab({ entry }: { entry: LedgerRow }) {
  const snapshot = entry.allocation_snapshot ?? null;

  return (
    <DataPanel
      title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Context</h3>}
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <SummaryCard
            label="Signed Amount"
            value={formatAmount(Math.abs(entry.signed_amount), entry.signed_amount >= 0 ? "positive" : "negative")}
            emphasis="strong"
          />
          <SummaryCard
            label="Balance After"
            value={
              entry.balance_after === null || entry.balance_after === undefined
                ? "-"
                : formatAmount(Math.abs(entry.balance_after), entry.balance_after >= 0 ? "positive" : "negative")
            }
          />
        </div>

        <p className="text-sm text-zinc-400">
          This entry is read-only and traceable through source references. All financial state is derived from
          finance_ledger.
        </p>

        <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <DetailItem label="Transaction Type" value={entry.transaction_type} />
          <DetailItem label="Source Summary" value={entry.source_summary} />
          <DetailItem label="Beneficiary" value={entry.beneficiary} />
          <DetailItem label="Trader User ID" value={entry.trader_user_id} mono />
          <DetailItem label="L1 User ID" value={entry.l1_ib_id ?? "-"} mono />
          <DetailItem label="L2 User ID" value={entry.l2_ib_id ?? "-"} mono />
          <DetailItem label="Relationship Snapshot" value={entry.relationship_snapshot_id ?? "-"} mono />
          <DetailItem label="Memo" value={entry.memo ?? "-"} />
          <DetailItem label="Description" value={entry.description ?? "-"} />
        </dl>

        {snapshot ? (
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Allocation Snapshot
            </p>
            <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <DetailItem label="Source Batch ID" value={formatSnapshotValue(snapshot.source_batch_id)} mono />
              <DetailItem
                label="Source Commission ID"
                value={formatSnapshotValue(snapshot.source_commission_id)}
                mono
              />
              <DetailItem label="Allocation Role" value={formatSnapshotValue(snapshot.allocation_role)} />
              <DetailItem label="Gross Commission" value={formatSnapshotValue(snapshot.gross_commission)} />
              <DetailItem label="Platform Amount" value={formatSnapshotValue(snapshot.platform_amount)} />
              <DetailItem label="Pool Amount" value={formatSnapshotValue(snapshot.pool_amount)} />
            </dl>
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

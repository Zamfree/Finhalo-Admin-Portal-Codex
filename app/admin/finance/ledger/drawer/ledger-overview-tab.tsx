import type { ReactNode } from "react";

import { DataPanel } from "@/components/system/data/data-panel";
import { formatAmount } from "../../_shared";
import type { LedgerRow } from "../../_types";

function formatTimestamp(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return value;
  }

  return new Date(parsed).toLocaleString();
}

export function LedgerOverviewTab({ entry }: { entry: LedgerRow }) {
  return (
    <DataPanel
      title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Overview</h3>}
    >
      <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <DetailItem label="Ledger Ref" value={entry.ledger_ref} mono />
        <DetailItem label="Timestamp" value={formatTimestamp(entry.created_at)} />
        <DetailItem label="Transaction Type" value={entry.transaction_type} />
        <DetailItem label="Source Summary" value={entry.source_summary} />
        <DetailItem label="Status" value={entry.status} />
        <DetailItem label="Direction" value={entry.direction} />
        <DetailItem
          label="Signed Amount"
          value={formatAmount(Math.abs(entry.signed_amount), entry.signed_amount >= 0 ? "positive" : "negative")}
          mono
        />
        <DetailItem
          label="Balance After"
          value={
            entry.balance_after === null || entry.balance_after === undefined
              ? "-"
              : formatAmount(Math.abs(entry.balance_after), entry.balance_after >= 0 ? "positive" : "negative")
          }
          mono
        />
        <DetailItem label="Currency" value={entry.currency ?? "-"} />
        <DetailItem label="User ID" value={entry.user_id ?? "-"} mono />
        <DetailItem label="User Display" value={entry.user_display ?? entry.beneficiary} />
        <DetailItem label="Account ID" value={entry.account_id} mono />
      </dl>
    </DataPanel>
  );
}

function DetailItem({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0 space-y-2">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</dt>
      <dd
        className={
          mono
            ? "min-w-0 break-all font-mono text-sm text-zinc-300"
            : "min-w-0 break-words text-sm text-zinc-300"
        }
      >
        {value}
      </dd>
    </div>
  );
}

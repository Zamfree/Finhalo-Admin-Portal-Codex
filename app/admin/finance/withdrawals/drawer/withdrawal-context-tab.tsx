import type { ReactNode } from "react";

import { DataPanel } from "@/components/system/data/data-panel";
import { SummaryCard, formatAmount } from "../../_shared";
import type { WithdrawalRow } from "../../_types";

export function WithdrawalContextTab({ withdrawal }: { withdrawal: WithdrawalRow }) {
  return (
    <DataPanel
      title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Context</h3>}
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <SummaryCard label="Withdrawal Amount" value={formatAmount(withdrawal.amount, "neutral")} emphasis="strong" />
          <SummaryCard label="Gas Fee" value={formatAmount(withdrawal.fee, "negative")} />
        </div>
        <p className="break-words text-sm text-zinc-400">
          Withdrawal review is anchored to the trading account and its related commission / rebate context.
        </p>
        <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <DetailItem
            label="Relationship Chain"
            value={`${withdrawal.trader_user_id} -> ${withdrawal.l1_ib_id ?? "—"} -> ${withdrawal.l2_ib_id ?? "—"}`}
          />
        </dl>
      </div>
    </DataPanel>
  );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 space-y-2">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-zinc-300">{value}</dd>
    </div>
  );
}

import type { ReactNode } from "react";

import { DataPanel } from "@/components/system/data/data-panel";
import { SummaryCard, formatAmount } from "../../_shared";
import type { WithdrawalRow } from "../../_types";
import { getWithdrawalChecklist } from "./withdrawal-audit";
import { WithdrawalWorkOrderSummary } from "./withdrawal-work-order-summary";

export function WithdrawalContextTab({ withdrawal }: { withdrawal: WithdrawalRow }) {
  const checklist = getWithdrawalChecklist(withdrawal);
  const issues = checklist.filter((item) => !item.passed);

  return (
    <DataPanel
      title={<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Context</h3>}
    >
      <div className="space-y-4">
        <WithdrawalWorkOrderSummary withdrawal={withdrawal} />
        <div className="grid gap-4 md:grid-cols-2">
          <SummaryCard
            label="Request Amount"
            value={formatAmount(withdrawal.request_amount, "neutral")}
            emphasis="strong"
          />
          <SummaryCard label="Net Payout" value={formatAmount(withdrawal.net_amount, "positive")} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <SummaryCard label="Fee Amount" value={formatAmount(withdrawal.fee_amount, "negative")} />
          <SummaryCard label="Currency" value={withdrawal.currency} />
        </div>

        <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <DetailItem
            label="Review Notes"
            value={withdrawal.review_notes && withdrawal.review_notes.trim() ? withdrawal.review_notes : "-"}
          />
          <DetailItem
            label="Rejection Reason"
            value={withdrawal.rejection_reason && withdrawal.rejection_reason.trim() ? withdrawal.rejection_reason : "-"}
          />
          <DetailItem
            label="Relationship Chain"
            value={`${withdrawal.trader_user_id} -> ${withdrawal.l1_ib_id ?? "-"} -> ${withdrawal.l2_ib_id ?? "-"}`}
          />
          <DetailItem
            label="Snapshot ID"
            value={withdrawal.relationship_snapshot_id ?? "-"}
          />
        </dl>

        <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Risk Flags
          </p>
          {issues.length === 0 ? (
            <p className="mt-1 text-xs text-emerald-300">No operational risk flags from current display data.</p>
          ) : (
            <div className="mt-2 space-y-1">
              {issues.map((issue) => (
                <p key={issue.label} className="text-xs text-amber-300">
                  CHECK | {issue.label}
                </p>
              ))}
            </div>
          )}
        </div>
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

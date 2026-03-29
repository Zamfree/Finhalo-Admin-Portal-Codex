import type { ReactNode } from "react";

import { DataPanel } from "@/components/system/data/data-panel";
import { StatusBadge } from "@/components/system/feedback/status-badge";
import { formatAmount } from "../../_shared";
import type { WithdrawalRow } from "../../_types";
import { WithdrawalWorkOrderSummary } from "./withdrawal-work-order-summary";

function getStatusClass(status: WithdrawalRow["status"]) {
  if (status === "requested") return "bg-amber-500/10 text-amber-300";
  if (status === "under_review") return "bg-sky-500/10 text-sky-300";
  if (status === "approved") return "bg-emerald-500/10 text-emerald-300";
  if (status === "processing") return "bg-indigo-500/10 text-indigo-300";
  if (status === "completed") return "bg-emerald-500/15 text-emerald-200";
  if (status === "failed") return "bg-rose-500/10 text-rose-300";
  if (status === "cancelled") return "bg-zinc-500/10 text-zinc-300";
  return "bg-rose-500/10 text-rose-300";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return value;
  }

  return new Date(parsed).toLocaleString();
}

function getOperatorNextStep(status: WithdrawalRow["status"]) {
  if (status === "requested") return "Move request into under_review queue.";
  if (status === "under_review") return "Approve, reject, or cancel after compliance review.";
  if (status === "approved") return "Trigger payout processing or mark completed if already sent.";
  if (status === "processing") return "Confirm payout result and mark completed/failed.";
  if (status === "failed") return "Investigate failure cause and release/retry based on policy.";
  if (status === "rejected") return "No downstream payout is allowed for this request.";
  if (status === "cancelled") return "Request was cancelled; keep audit trail only.";
  return "Request is completed.";
}

export function WithdrawalOverviewTab({ withdrawal }: { withdrawal: WithdrawalRow }) {
  return (
    <DataPanel
      title={<h3 className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Overview</h3>}
    >
      <div className="mb-4">
        <WithdrawalWorkOrderSummary withdrawal={withdrawal} />
      </div>
      <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 xl:grid-cols-3">
        <DetailItem label="Withdrawal ID" value={withdrawal.withdrawal_id} mono />
        <DetailItem label="User" value={withdrawal.beneficiary} />
        <DetailItem label="User ID" value={withdrawal.user_id} mono />
        <DetailItem label="Account ID" value={withdrawal.account_id} mono />
        <DetailItem label="Requested At" value={formatDateTime(withdrawal.requested_at)} />
        <DetailItem
          label="Status"
          value={
            <StatusBadge size="default" toneClassName={getStatusClass(withdrawal.status)}>
              {withdrawal.status}
            </StatusBadge>
          }
        />
        <DetailItem label="Request Amount" value={formatAmount(withdrawal.request_amount, "neutral")} />
        <DetailItem label="Fee Amount" value={formatAmount(withdrawal.fee_amount, "negative")} />
        <DetailItem label="Net Amount" value={formatAmount(withdrawal.net_amount, "positive")} />
        <DetailItem label="Currency" value={withdrawal.currency} mono />
        <DetailItem label="Payout Method" value={withdrawal.payout_method} />
        <DetailItem label="Destination" value={withdrawal.destination} mono />
        <DetailItem label="Reviewed At" value={formatDateTime(withdrawal.reviewed_at)} />
        <DetailItem label="Reviewed By" value={withdrawal.reviewed_by ?? "-"} mono />
        <DetailItem label="Processed At" value={formatDateTime(withdrawal.processed_at)} />
        <DetailItem label="Processed By" value={withdrawal.processed_by ?? "-"} mono />
      </dl>
      <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Operator Next Step
        </p>
        <p className="mt-1 text-sm text-zinc-300">{getOperatorNextStep(withdrawal.status)}</p>
      </div>
    </DataPanel>
  );
}

function DetailItem({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0 space-y-2">
      <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</dt>
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

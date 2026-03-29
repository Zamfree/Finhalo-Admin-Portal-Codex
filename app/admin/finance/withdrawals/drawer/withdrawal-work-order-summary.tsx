import { formatAmount } from "../../_shared";
import type { WithdrawalRow } from "../../_types";
import {
  getWithdrawalChecklist,
  getWithdrawalCurrentActionHint,
} from "./withdrawal-audit";

export function WithdrawalWorkOrderSummary({
  withdrawal,
}: {
  withdrawal: WithdrawalRow;
}) {
  const checklist = getWithdrawalChecklist(withdrawal);
  const blockingCount = checklist.filter((item) => !item.passed).length;
  const eventCount = withdrawal.events?.length ?? 0;
  const ledgerLinkCount = withdrawal.linked_ledger_entries?.length ?? 0;
  const isTerminal =
    withdrawal.status === "completed" ||
    withdrawal.status === "rejected" ||
    withdrawal.status === "failed" ||
    withdrawal.status === "cancelled";

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Work Order Snapshot
      </p>
      <p className="mt-1 text-sm text-zinc-300">
        {getWithdrawalCurrentActionHint(withdrawal.status)}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <InfoChip label="Request" value={formatAmount(withdrawal.request_amount, "neutral")} />
        <InfoChip label="Net" value={formatAmount(withdrawal.net_amount, "positive")} />
        <InfoChip label="Blocking" value={String(blockingCount)} warning={blockingCount > 0} />
        <InfoChip label="Events" value={String(eventCount)} />
        <InfoChip label="Ledger Links" value={String(ledgerLinkCount)} />
        <InfoChip label="Mode" value={isTerminal ? "terminal" : "active"} />
      </div>
    </div>
  );
}

function InfoChip({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
        warning
          ? "border-amber-400/30 bg-amber-500/10 text-amber-300"
          : "border-white/10 bg-white/[0.03] text-zinc-400"
      }`}
    >
      {label}: {value}
    </span>
  );
}

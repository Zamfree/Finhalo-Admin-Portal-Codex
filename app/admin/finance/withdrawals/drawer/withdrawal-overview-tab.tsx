import type { ReactNode } from "react";

import { DataPanel } from "@/components/system/data/data-panel";
import { StatusBadge } from "@/components/system/feedback/status-badge";
import type { WithdrawalRow } from "../../_types";

function getStatusClass(status: WithdrawalRow["status"]) {
  if (status === "pending") return "bg-amber-500/10 text-amber-300";
  if (status === "approved") return "bg-emerald-500/10 text-emerald-300";
  return "bg-rose-500/10 text-rose-300";
}

export function WithdrawalOverviewTab({ withdrawal }: { withdrawal: WithdrawalRow }) {
  return (
    <DataPanel
      title={<h3 className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Overview</h3>}
    >
      <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <DetailItem label="Withdrawal ID" value={withdrawal.withdrawal_id} mono />
        <DetailItem label="Beneficiary" value={withdrawal.beneficiary} />
        <DetailItem label="Account ID" value={withdrawal.account_id} mono />
        <DetailItem label="Requested At" value={new Date(withdrawal.requested_at).toLocaleString()} />
        <DetailItem
          label="Status"
          value={<StatusBadge size="default" toneClassName={getStatusClass(withdrawal.status)}>{withdrawal.status}</StatusBadge>}
        />
      </dl>
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

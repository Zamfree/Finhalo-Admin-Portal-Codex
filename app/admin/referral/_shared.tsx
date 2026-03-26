import type { ReactNode } from "react";
import type { DataTableColumn } from "@/components/system/data/data-table";
import type { ReferralRecord } from "./_types";

export function ReferralSummaryCard({
  label,
  value,
  emphasis = "default",
}: {
  label: string;
  value: ReactNode;
  emphasis?: "default" | "strong";
}) {
  return (
    <div className="admin-surface-soft rounded-2xl p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p
        className={`mt-2 font-semibold tabular-nums ${emphasis === "strong" ? "text-xl text-white" : "text-lg text-zinc-200"}`}
      >
        {value}
      </p>
    </div>
  );
}
export const referralColumns: DataTableColumn<ReferralRecord>[] = [
  {
    key: "name",
    header: "Program",
    cell: (row) => (
      <div className="space-y-1">
        <p className="text-sm font-medium text-white">{row.name}</p>
        <p className="font-mono text-xs text-zinc-500">{row.referral_id}</p>
      </div>
    ),
    cellClassName: "py-3 pr-4",
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => <span className="text-sm text-zinc-300">{row.status}</span>,
    cellClassName: "py-3 pr-4",
  },
  {
    key: "reward_model",
    header: "Reward Model",
    cell: (row) => row.reward_model,
    cellClassName: "py-3 pr-4 text-sm text-zinc-300",
  },
  {
    key: "participants",
    header: "Participants",
    cell: (row) => row.participants,
    cellClassName: "py-3 pr-4 text-sm tabular-nums text-white",
  },
  {
    key: "start_end",
    header: "Start / End",
    cell: (row) => (
      <div className="space-y-1 text-sm text-zinc-400">
        <p>{new Date(row.start_at).toLocaleDateString()}</p>
        <p>{new Date(row.end_at).toLocaleDateString()}</p>
      </div>
    ),
    cellClassName: "py-3 pr-0",
  },
];
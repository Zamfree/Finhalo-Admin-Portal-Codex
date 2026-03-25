import type { ReactNode } from "react";

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

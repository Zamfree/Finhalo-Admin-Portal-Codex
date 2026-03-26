import type { ReactNode } from "react";

type SummaryCardProps = {
  label: string;
  value: ReactNode;
  emphasis?: "default" | "strong";
  className?: string;
};

export function SummaryCard({
  label,
  value,
  emphasis = "default",
  className = "",
}: SummaryCardProps) {
  return (
    <div
      className={`admin-surface-soft admin-summary-card rounded-2xl p-4 ${
        emphasis === "strong" ? "border-white/10 bg-white/[0.025]" : ""
      } ${className}`}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-2 font-semibold tabular-nums text-white ${
          emphasis === "strong" ? "text-[1.125rem] tracking-[-0.02em]" : "text-[0.95rem]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

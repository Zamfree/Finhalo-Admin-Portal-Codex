import type { ReactNode } from "react";

export function formatAmount(
  value: number,
  mode: "positive" | "negative" | "neutral" = "neutral"
) {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  if (mode === "positive") {
    return `+$${formatted}`;
  }

  if (mode === "negative") {
    return `-$${formatted}`;
  }

  return `$${formatted}`;
}

export function SummaryCard({
  label,
  value,
  emphasis = "default",
}: {
  label: string;
  value: ReactNode;
  emphasis?: "default" | "strong";
}) {
  return (
    <div
      className={`admin-surface-soft rounded-2xl p-4 ${
        emphasis === "strong" ? "border-white/10 bg-white/[0.04]" : ""
      }`}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-2 font-semibold tabular-nums text-white ${
          emphasis === "strong" ? "text-xl" : "text-lg"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

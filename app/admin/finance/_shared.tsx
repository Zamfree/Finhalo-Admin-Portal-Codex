import Link from "next/link";

import { AdminButton } from "@/components/system/actions/admin-button";
import { formatTruncatedCurrencyByMode } from "@/lib/money-display";
import type { FinanceOperationalStage } from "./_types";

export { SummaryCard } from "@/components/system/cards/summary-card";

export function formatAmount(
  value: number,
  mode: "positive" | "negative" | "neutral" = "neutral"
) {
  return formatTruncatedCurrencyByMode(value, mode);
}

export function FinanceWorkflowCard({ stage }: { stage: FinanceOperationalStage }) {
  return (
    <div className="admin-surface-soft rounded-2xl p-5">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          {stage.label}
        </p>
        <p className="text-sm leading-6 text-zinc-300">{stage.description}</p>
      </div>

      <div className="mt-5 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          {stage.metricLabel}
        </p>
        <p className="text-lg font-semibold tabular-nums text-white">{stage.metricValue}</p>
      </div>

      <div className="mt-5">
        <Link href={stage.href}>
          <AdminButton variant="secondary" className="h-10 px-4">
            Open
          </AdminButton>
        </Link>
      </div>
    </div>
  );
}

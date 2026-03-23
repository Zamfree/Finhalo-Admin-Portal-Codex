import { DataPanel } from "@/components/system/data/data-panel";

import { SummaryCard, formatAmount } from "../_shared";
import {
  ReconciliationPageClient,
  type ReconciliationRow,
} from "./reconciliation-page-client";

const MOCK_RECONCILIATION_ROWS: ReconciliationRow[] = [
  {
    period: "2026-03-01 to 2026-03-15",
    broker: "IC Markets",
    input_commission_total: 45210.5,
    platform_total: 4521.05,
    rebate_total: 21680.12,
    ledger_total: 21680.12,
    paid_total: 20800.12,
    difference: 880,
    status: "review",
  },
  {
    period: "2026-03-01 to 2026-03-15",
    broker: "Pepperstone",
    input_commission_total: 33100,
    platform_total: 3310,
    rebate_total: 14980,
    ledger_total: 14980,
    paid_total: 14980,
    difference: 0,
    status: "matched",
  },
  {
    period: "2026-03-16 to 2026-03-22",
    broker: "XM",
    input_commission_total: 28750.25,
    platform_total: 2875.03,
    rebate_total: 13220,
    ledger_total: 13120,
    paid_total: 12900,
    difference: -320,
    status: "alert",
  },
];

export default function ReconciliationPage() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Reconciliation
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          Reconciliation<span className="ml-1.5 inline-block text-teal-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">
          Reconciliation view for comparing commission outputs against ledger totals and payout records.
        </p>
      </div>

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Reconciliation Alerts" value={MOCK_RECONCILIATION_ROWS.filter((row) => row.status === "alert").length} emphasis="strong" />
        <SummaryCard label="Review Items" value={MOCK_RECONCILIATION_ROWS.filter((row) => row.status === "review").length} />
        <SummaryCard label="Matched" value={MOCK_RECONCILIATION_ROWS.filter((row) => row.status === "matched").length} />
        <SummaryCard
          label="Net Difference"
          value={formatAmount(
            MOCK_RECONCILIATION_ROWS.reduce((sum, row) => sum + row.difference, 0),
            "neutral"
          )}
        />
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Reconciliation Review</h2>}
        description={
          <p className="max-w-2xl text-sm text-zinc-400">
            Matched, review, and alert indicate comparison result state across commission outputs, ledger totals, and payout records.
          </p>
        }
      >
        <ReconciliationPageClient rows={MOCK_RECONCILIATION_ROWS} />
      </DataPanel>
    </div>
  );
}

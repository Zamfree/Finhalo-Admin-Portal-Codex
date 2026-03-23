import { AdminButton } from "@/components/system/actions/admin-button";
import { DataPanel } from "@/components/system/data/data-panel";

import { SummaryCard, formatAmount } from "../_shared";
import {
  AdjustmentsPageClient,
  type AdjustmentRow,
} from "./adjustments-page-client";

const MOCK_ADJUSTMENTS: AdjustmentRow[] = [
  {
    adjustment_id: "ADJ-7001",
    beneficiary: "alice@example.com",
    account_id: "ACC-2001",
    adjustment_type: "credit",
    amount: 35,
    reason: "Manual rebate correction",
    operator: "ops_finance_1",
    created_at: "2026-03-21T11:00:00Z",
  },
  {
    adjustment_id: "ADJ-7002",
    beneficiary: "bob@example.com",
    account_id: "ACC-2002",
    adjustment_type: "debit",
    amount: 12.5,
    reason: "Duplicate payout reversal",
    operator: "ops_finance_2",
    created_at: "2026-03-22T09:10:00Z",
  },
];

export default function AdjustmentsPage() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Adjustments
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          Adjustments<span className="ml-1.5 inline-block text-teal-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">
          Balance adjustment placeholders for manual finance operations.
        </p>
      </div>

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Adjustments This Month"
          value={formatAmount(
            MOCK_ADJUSTMENTS.reduce(
              (sum, row) => sum + (row.adjustment_type === "credit" ? row.amount : -row.amount),
              0
            ),
            "neutral"
          )}
          emphasis="strong"
        />
        <SummaryCard label="Entries" value={MOCK_ADJUSTMENTS.length} />
        <SummaryCard label="Credits" value={MOCK_ADJUSTMENTS.filter((row) => row.adjustment_type === "credit").length} />
        <SummaryCard label="Debits" value={MOCK_ADJUSTMENTS.filter((row) => row.adjustment_type === "debit").length} />
      </div>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Balance Adjustments</h2>}
        description={
          <p className="max-w-2xl text-sm text-zinc-400">
            Credit and debit labels indicate recorded adjustment direction only.
          </p>
        }
        actions={
          <div className="flex gap-2">
            <AdminButton variant="primary" className="h-11 px-5">
              Create Adjustment
            </AdminButton>
            <AdminButton variant="secondary" className="h-11 px-5">
              Batch Adjustment
            </AdminButton>
          </div>
        }
      >
        <AdjustmentsPageClient rows={MOCK_ADJUSTMENTS} />
      </DataPanel>
    </div>
  );
}

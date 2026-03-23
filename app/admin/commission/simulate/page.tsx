import { DataPanel } from "@/components/system/data/data-panel";

import { SummaryCard, formatAmount } from "../_shared";
import { MOCK_SIMULATION_PREVIEW } from "../_mock-data";

export default function CommissionSimulatePage() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Commission Simulate
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          Simulation Preview<span className="ml-1.5 inline-block text-amber-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">
          Preview-only commission simulation. No database write, rebate record creation, or finance
          record creation occurs on this page.
        </p>
      </div>

      <DataPanel>
        <p className="text-sm font-medium text-zinc-300">
          Simulation Only - This preview does not create commission, rebate, or finance records.
        </p>
      </DataPanel>

      <DataPanel
        title={<h2 className="text-xl font-semibold text-white">Simulation Controls</h2>}
        description={
          <div className="max-w-2xl space-y-2 text-sm text-zinc-400">
            <p>Lightweight mock controls for broker selection and commission preview only.</p>
            <p className="text-zinc-500">
              Use this preview to review waterfall outcomes before confirming any real batch
              workflow.
            </p>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Broker
            </label>
            <div className="admin-control flex h-11 items-center rounded-xl px-4 text-sm text-zinc-200">
              {MOCK_SIMULATION_PREVIEW.broker}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Gross Commission Input
            </label>
            <div className="admin-control flex h-11 items-center rounded-xl px-4 text-sm text-zinc-200">
              {formatAmount(MOCK_SIMULATION_PREVIEW.gross_commission, "neutral")}
            </div>
          </div>
        </div>
      </DataPanel>

      <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Platform Retained Preview"
          value={formatAmount(MOCK_SIMULATION_PREVIEW.platform_retained, "negative")}
          emphasis="strong"
        />
        <SummaryCard
          label="L2 Commission Preview"
          value={formatAmount(MOCK_SIMULATION_PREVIEW.l2_commission, "negative")}
        />
        <SummaryCard
          label="Remaining Pool Preview"
          value={formatAmount(MOCK_SIMULATION_PREVIEW.remaining_pool, "neutral")}
        />
        <SummaryCard
          label="Trader + L1 Preview"
          value={formatAmount(MOCK_SIMULATION_PREVIEW.trader_cashback + MOCK_SIMULATION_PREVIEW.l1_commission, "positive")}
        />
      </div>

      <DataPanel title={<h2 className="text-xl font-semibold text-white">Waterfall Preview</h2>}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="Gross Commission"
            value={formatAmount(MOCK_SIMULATION_PREVIEW.gross_commission, "neutral")}
            emphasis="strong"
          />
          <SummaryCard
            label="Platform Retained"
            value={formatAmount(MOCK_SIMULATION_PREVIEW.platform_retained, "negative")}
          />
          <SummaryCard
            label="L2 Commission"
            value={formatAmount(MOCK_SIMULATION_PREVIEW.l2_commission, "negative")}
          />
          <SummaryCard
            label="Remaining Pool"
            value={formatAmount(MOCK_SIMULATION_PREVIEW.remaining_pool, "neutral")}
          />
          <SummaryCard
            label="Trader + L1 Distribution"
            value={formatAmount(MOCK_SIMULATION_PREVIEW.trader_cashback + MOCK_SIMULATION_PREVIEW.l1_commission, "positive")}
          />
        </div>
      </DataPanel>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";

import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";

import { formatAmount } from "../_shared";
import type { SimulationPreviewData } from "../_types";

type SimulationRow = {
  item: string;
  value: number;
};

function toFiniteNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

export function CommissionSimulateClient({ preview }: { preview: SimulationPreviewData }) {
  const [grossInput, setGrossInput] = useState(String(preview.gross_commission));
  const [platformRateInput, setPlatformRateInput] = useState(
    String((preview.platform_retained / Math.max(preview.gross_commission, 1)) * 100)
  );
  const [l2RateInput, setL2RateInput] = useState(
    String((preview.l2_commission / Math.max(preview.gross_commission, 1)) * 100)
  );
  const [traderRateInput, setTraderRateInput] = useState(
    String((preview.trader_cashback / Math.max(preview.remaining_pool, 1)) * 100)
  );
  const [l1RateInput, setL1RateInput] = useState(
    String((preview.l1_commission / Math.max(preview.remaining_pool, 1)) * 100)
  );

  const simulation = useMemo(() => {
    const grossCommission = Math.max(0, toFiniteNumber(grossInput, preview.gross_commission));
    const platformRate = clampPercent(toFiniteNumber(platformRateInput, 0));
    const l2Rate = clampPercent(toFiniteNumber(l2RateInput, 0));
    const traderRate = clampPercent(toFiniteNumber(traderRateInput, 0));
    const l1Rate = clampPercent(toFiniteNumber(l1RateInput, 0));

    const platformRetained = (grossCommission * platformRate) / 100;
    const l2Commission = (grossCommission * l2Rate) / 100;
    const remainingPool = Math.max(grossCommission - platformRetained - l2Commission, 0);
    const traderCashback = (remainingPool * traderRate) / 100;
    const l1Commission = (remainingPool * l1Rate) / 100;
    const unallocated = Math.max(remainingPool - traderCashback - l1Commission, 0);

    return {
      grossCommission,
      platformRate,
      l2Rate,
      traderRate,
      l1Rate,
      platformRetained,
      l2Commission,
      remainingPool,
      traderCashback,
      l1Commission,
      unallocated,
    };
  }, [
    grossInput,
    l1RateInput,
    l2RateInput,
    platformRateInput,
    preview.gross_commission,
    traderRateInput,
  ]);

  const rows: SimulationRow[] = [
    { item: "Gross Commission", value: simulation.grossCommission },
    { item: "Platform Retained", value: simulation.platformRetained },
    { item: "L2 Commission", value: simulation.l2Commission },
    { item: "Remaining Pool", value: simulation.remainingPool },
    { item: "Trader Cashback", value: simulation.traderCashback },
    { item: "L1 Commission", value: simulation.l1Commission },
    { item: "Unallocated Pool", value: simulation.unallocated },
  ];

  const columns: DataTableColumn<SimulationRow>[] = [
    {
      key: "item",
      header: "Allocation Stage",
      cell: (row) => row.item,
      cellClassName: "py-2 pr-4 text-zinc-300",
    },
    {
      key: "value",
      header: "Amount",
      cell: (row) => formatAmount(row.value, "neutral"),
      headerClassName:
        "py-2 pr-0 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName: "py-2 pr-0 text-right tabular-nums text-white",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <LabeledInput
          id="simulation_gross"
          label="Gross Commission"
          value={grossInput}
          onChange={setGrossInput}
          step="0.01"
        />
        <LabeledInput
          id="simulation_platform_rate"
          label="Platform Rate (%)"
          value={platformRateInput}
          onChange={setPlatformRateInput}
          step="0.01"
        />
        <LabeledInput
          id="simulation_l2_rate"
          label="L2 Rate (%)"
          value={l2RateInput}
          onChange={setL2RateInput}
          step="0.01"
        />
        <LabeledInput
          id="simulation_trader_rate"
          label="Trader Rate (%)"
          value={traderRateInput}
          onChange={setTraderRateInput}
          step="0.01"
        />
        <LabeledInput
          id="simulation_l1_rate"
          label="L1 Rate (%)"
          value={l1RateInput}
          onChange={setL1RateInput}
          step="0.01"
        />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.item}
        minWidthClassName="min-w-[680px]"
        rowClassName="text-zinc-200"
      />
    </div>
  );
}

function LabeledInput({
  id,
  label,
  value,
  onChange,
  step,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  step: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
      >
        {label}
      </label>
      <input
        id={id}
        type="number"
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none"
      />
    </div>
  );
}

"use client";

import { AdminButton } from "@/components/system/actions/admin-button";
import type { FilterBarBaseProps } from "@/types/system/filters";

import type { CommissionFilters } from "./_types";

type CommissionFilterBarProps = FilterBarBaseProps<CommissionFilters> & {
  searchPlaceholder: string;
  clearLabel: string;
  brokerOptions: string[];
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  activeAdvancedCount: number;
};

export function CommissionFilterBar({
  inputFilters,
  setInputFilter,
  applyFilters,
  clearFilters,
  searchPlaceholder,
  clearLabel,
  brokerOptions,
  showAdvanced,
  onToggleAdvanced,
  activeAdvancedCount,
}: CommissionFilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-end">
        <div>
          <label
            htmlFor="commission_query"
            className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500"
          >
            Search
          </label>
          <input
            id="commission_query"
            name="commission_query"
            value={inputFilters.query}
            onChange={(event) => setInputFilter("query", event.target.value)}
            placeholder={searchPlaceholder}
            className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
          />
        </div>

        <AdminButton variant="ghost" onClick={onToggleAdvanced} className="h-11 px-4">
          {showAdvanced ? "Hide Advanced" : "Show Advanced"}
          {activeAdvancedCount > 0 ? ` (${activeAdvancedCount})` : ""}
        </AdminButton>

        <AdminButton variant="ghost" onClick={clearFilters} className="h-11 px-4">
          {clearLabel}
        </AdminButton>
        <AdminButton variant="primary" onClick={applyFilters} className="h-11 px-4">
          Apply Filters
        </AdminButton>
      </div>

      {showAdvanced ? (
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Advanced Filters
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label
                htmlFor="commission_broker"
                className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500"
              >
                Broker
              </label>
              <input
                id="commission_broker"
                name="commission_broker"
                list="commission-broker-options"
                value={inputFilters.broker}
                onChange={(event) => setInputFilter("broker", event.target.value)}
                placeholder="All brokers"
                className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
              />
              <datalist id="commission-broker-options">
                {brokerOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>

            <div>
              <label
                htmlFor="commission_date_from"
                className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500"
              >
                Date From
              </label>
              <input
                id="commission_date_from"
                name="commission_date_from"
                type="date"
                value={inputFilters.date_from}
                onChange={(event) => setInputFilter("date_from", event.target.value)}
                className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="commission_date_to"
                className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500"
              >
                Date To
              </label>
              <input
                id="commission_date_to"
                name="commission_date_to"
                type="date"
                value={inputFilters.date_to}
                onChange={(event) => setInputFilter("date_to", event.target.value)}
                className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
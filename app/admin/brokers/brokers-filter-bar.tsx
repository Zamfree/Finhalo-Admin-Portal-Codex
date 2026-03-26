"use client";

import { FilterBar } from "@/components/system/data/filter-bar";
import { AdminSelect } from "@/components/system/controls/admin-select";
import { brokerStatusFilterOptions } from "./_shared";
import type { BrokerFilterControls } from "./_types";

export function BrokersFilterBar({
  inputFilters,
  setInputFilter,
  applyFilters,
  clearFilters,
}: BrokerFilterControls) {
  return (
    <FilterBar
      onApply={(event) => {
        event.preventDefault();
        applyFilters();
      }}
      onReset={clearFilters}
      search={
        <div>
          <label
            htmlFor="broker_query"
            className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
          >
            Search
          </label>
          <input
            id="broker_query"
            name="broker_query"
            value={inputFilters.broker_query}
            onChange={(event) => setInputFilter("broker_query", event.target.value)}
            placeholder="Search brokers by name or ID"
            className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
          />
        </div>
      }
      filters={
        <div className="sm:w-[200px]">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Status
          </label>
          <AdminSelect
            value={inputFilters.status}
            onValueChange={(value) => setInputFilter("status", value as typeof inputFilters.status)}
            options={brokerStatusFilterOptions}
          />
        </div>
      }
    />
  );
}

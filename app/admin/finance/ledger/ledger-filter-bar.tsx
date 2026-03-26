"use client";

import { FilterBar } from "@/components/system/data/filter-bar";
import { AdminSelect } from "@/components/system/controls/admin-select";
import type { LedgerFilterControls, LedgerFilters } from "../_types";

export function LedgerFilterBar({
  inputFilters,
  setInputFilter,
  applyFilters,
  clearFilters,
}: LedgerFilterControls) {
  return (
    <FilterBar
      onApply={(event) => {
        event.preventDefault();
        applyFilters();
      }}
      onReset={clearFilters}
      search={
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Search
          </label>
          <input
            value={inputFilters.query}
            onChange={(event) => setInputFilter("query", event.target.value)}
            placeholder="Search ledger / beneficiary / account / rebate"
            className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
          />
        </div>
      }
      filters={
        <div className="sm:w-[220px]">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Status
          </label>
          <AdminSelect<LedgerFilters["status"]>
            value={inputFilters.status}
            onValueChange={(value) => setInputFilter("status", value)}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "posted", label: "Posted" },
              { value: "pending", label: "Pending" },
              { value: "reversed", label: "Reversed" },
            ]}
          />
        </div>
      }
    />
  );
}

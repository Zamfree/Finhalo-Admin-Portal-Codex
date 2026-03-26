"use client";

import { FilterBar } from "@/components/system/data/filter-bar";
import { AdminSelect } from "@/components/system/controls/admin-select";
import type { WithdrawalFilterControls, WithdrawalFilters } from "../_types";

export function WithdrawalsFilterBar({
  inputFilters,
  setInputFilter,
  applyFilters,
  clearFilters,
}: WithdrawalFilterControls) {
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
            placeholder="Search withdrawal / beneficiary / account / wallet"
            className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
          />
        </div>
      }
      filters={
        <div className="sm:w-[220px]">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Status
          </label>
          <AdminSelect<WithdrawalFilters["status"]>
            value={inputFilters.status}
            onValueChange={(value) => setInputFilter("status", value)}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
            ]}
          />
        </div>
      }
    />
  );
}

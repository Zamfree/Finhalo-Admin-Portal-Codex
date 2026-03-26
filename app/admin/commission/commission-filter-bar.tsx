"use client";

import type { FilterBarBaseProps } from "@/types/system/filters";
import { AdminButton } from "@/components/system/actions/admin-button";

import type { CommissionFilters } from "./_types";

type CommissionFilterBarProps = FilterBarBaseProps<CommissionFilters> & {
  searchPlaceholder: string;
  clearLabel: string;
};

export function CommissionFilterBar({
  inputFilters,
  setInputFilter,
  applyFilters,
  clearFilters,
  searchPlaceholder,
  clearLabel,
}: CommissionFilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
        <div>
          <label
            htmlFor="commission_query"
            className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
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
        <AdminButton variant="ghost" onClick={clearFilters} className="h-11 px-4">
          {clearLabel}
        </AdminButton>
        <AdminButton variant="primary" onClick={applyFilters} className="h-11 px-4">
          Apply Filters
        </AdminButton>
      </div>
    </div>
  );
}

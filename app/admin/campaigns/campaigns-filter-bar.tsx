"use client";

import { AdminButton } from "@/components/system/actions/admin-button";
import { AdminSelect } from "@/components/system/controls/admin-select";
import type { FilterBarBaseProps } from "@/types/system/filters";
import type { CampaignFilters } from "./_types";

type CampaignsFilterBarProps = FilterBarBaseProps<CampaignFilters> & {
  searchPlaceholder: string;
};

export function CampaignsFilterBar({
  inputFilters,
  setInputFilter,
  applyFilters,
  clearFilters,
  searchPlaceholder,
}: CampaignsFilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_180px_180px]">
        <input
          value={inputFilters.query}
          onChange={(event) => setInputFilter("query", event.target.value)}
          placeholder={searchPlaceholder}
          className="admin-control h-11 rounded-xl px-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
        />

        <AdminSelect
          value={inputFilters.status}
          onValueChange={(value) => setInputFilter("status", value)}
          options={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "scheduled", label: "Scheduled" },
            { value: "ended", label: "Ended" },
          ]}
        />

        <AdminSelect
          value={inputFilters.type}
          onValueChange={(value) => setInputFilter("type", value)}
          options={[
            { value: "all", label: "All types" },
            { value: "trading", label: "Trading" },
            { value: "deposit", label: "Deposit" },
            { value: "referral", label: "Referral" },
          ]}
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <AdminButton variant="ghost" onClick={clearFilters}>
          Clear
        </AdminButton>
        <AdminButton variant="primary" onClick={applyFilters}>
          Apply Filters
        </AdminButton>
      </div>
    </div>
  );
}
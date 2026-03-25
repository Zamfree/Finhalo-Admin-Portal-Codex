"use client";

import { AdminButton } from "@/components/system/actions/admin-button";
import { AdminSelect } from "@/components/system/controls/admin-select";

export function ReferralFilterBar({
  inputFilters,
  setInputFilter,
  applyFilters,
  clearFilters,
}: {
  inputFilters: { query: string; status: string };
  setInputFilter: (key: "query" | "status", value: string) => void;
  applyFilters: () => void;
  clearFilters: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_220px]">
        <input
          value={inputFilters.query}
          onChange={(event) => setInputFilter("query", event.target.value)}
          placeholder="Search referral programs by name, reward model, or status"
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

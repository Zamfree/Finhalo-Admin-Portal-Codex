"use client";

import { AdminButton } from "@/components/system/actions/admin-button";
import { AdminSelect } from "@/components/system/controls/admin-select";

type UsersFilterBarProps = {
  inputFilters: {
    query: string;
    status: string;
  };
  setInputFilter: (key: "query" | "status", value: string) => void;
  applyFilters: () => void;
  clearFilters: () => void;
};

export function UsersFilterBar({
  inputFilters,
  setInputFilter,
  applyFilters,
  clearFilters,
}: UsersFilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_220px]">
        <input
          value={inputFilters.query}
          onChange={(event) => setInputFilter("query", event.target.value)}
          placeholder="Search users by email or ID"
          className="admin-interactive h-11 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-zinc-500 focus:border-white/20 focus:outline-none"
        />

        <AdminSelect
          value={inputFilters.status}
          onValueChange={(value) => setInputFilter("status", value)}
          placeholder="Filter by status"
          options={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "restricted", label: "Restricted" },
            { value: "suspended", label: "Suspended" },
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
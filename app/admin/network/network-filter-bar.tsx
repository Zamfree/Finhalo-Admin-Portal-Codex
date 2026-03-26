"use client";

import { useAdminPreferences } from "@/components/system/layout/admin-preferences-provider";
import { FilterBar } from "@/components/system/data/filter-bar";
import { AdminSelect } from "@/components/system/controls/admin-select";
import type { NetworkFilterControls, NetworkStatusFilter } from "./_types";
import { NETWORK_STATUS_OPTIONS } from "./_constants";

export function NetworkFilterBar({
  inputFilters,
  setInputFilter,
  applyFilters,
  clearFilters,
}: NetworkFilterControls) {
  const { t } = useAdminPreferences();

  return (
    <FilterBar
      onApply={(event) => {
        event.preventDefault();
        applyFilters();
      }}
      onReset={clearFilters}
      resetLabel={t("common.actions.clear")}
      search={
        <div>
          <label
            htmlFor="network-query"
            className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
          >
            {t("common.labels.search")}
          </label>
          <input
            id="network-query"
            value={inputFilters.query}
            onChange={(event) => setInputFilter("query", event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                applyFilters();
              }
            }}
            placeholder="Search node / email / uplink"
            className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
          />
        </div>
      }
      filters={
        <div className="sm:w-[220px]">
          <label
            htmlFor="network-status"
            className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
          >
            {t("common.labels.status")}
          </label>
          <AdminSelect<NetworkStatusFilter>
            value={inputFilters.status}
            onValueChange={(value) => setInputFilter("status", value)}
            options={NETWORK_STATUS_OPTIONS}
          />
        </div>
      }
    />
  );
}

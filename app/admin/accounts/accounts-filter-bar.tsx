"use client";

import type { FilterBarBaseProps } from "@/types/system/filters";
import type { AccountFilters } from "./_types";
import { AdminButton } from "@/components/system/actions/admin-button";
import { AdminSelect } from "@/components/system/controls/admin-select";

type AccountsFilterBarProps = FilterBarBaseProps<AccountFilters> & {
  brokerOptions: { value: string; label: string }[];
  t: (key: string) => string;
};

export function AccountsFilterBar({
  inputFilters,
  brokerOptions,
  setInputFilter,
  applyFilters,
  clearFilters,
  t,
}: AccountsFilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.35fr)_220px_220px]">
        <input
          value={inputFilters.query}
          onChange={(event) => setInputFilter("query", event.target.value)}
          placeholder={t("account.traderAccountSearchPlaceholder")}
          className="admin-control h-11 rounded-xl px-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
        />
        <AdminSelect
          value={inputFilters.broker}
          onValueChange={(value) => setInputFilter("broker", value)}
          options={brokerOptions}
        />
        <AdminSelect
          value={inputFilters.status}
          onValueChange={(value) => setInputFilter("status", value)}
          options={[
            { value: "all", label: t("common.filters.allStatuses") },
            { value: "active", label: t("account.active") },
            { value: "monitoring", label: t("account.monitoring") },
            { value: "suspended", label: t("account.suspended") },
          ]}
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <AdminButton variant="ghost" onClick={clearFilters}>
          {t("common.actions.clear")}
        </AdminButton>
        <AdminButton variant="primary" onClick={applyFilters}>
          Apply Filters
        </AdminButton>
      </div>
    </div>
  );
}

"use client";

import { useAdminPreferences } from "@/components/system/layout/admin-preferences-provider";
import { FilterBar } from "@/components/system/data/filter-bar";
import { AdminSelect } from "@/components/system/controls/admin-select";
import type {
  SupportFilterControls,
  SupportFilters,
  SupportTicketCategory,
  SupportTicketStatus,
} from "./_types";

const STATUS_OPTIONS = [
  "open",
  "in_progress",
  "waiting_user",
  "resolved",
  "closed",
] as const satisfies readonly SupportTicketStatus[];

const CATEGORY_OPTIONS = [
  "account",
  "commission",
  "rebate",
  "withdrawal",
  "finance",
  "technical",
  "verification",
  "general",
] as const satisfies readonly SupportTicketCategory[];

export function SupportFilterBar({
  inputFilters,
  setInputFilter,
  applyFilters,
  clearFilters,
}: SupportFilterControls) {
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
            htmlFor="support-query"
            className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500"
          >
            {t("common.labels.search")}
          </label>
          <input
            id="support-query"
            value={inputFilters.query}
            onChange={(event) => setInputFilter("query", event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                applyFilters();
              }
            }}
            placeholder={t("support.searchPlaceholder")}
            className="admin-control h-11 w-full rounded-xl px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
          />
        </div>
      }
      filters={
        <>
          <div className="sm:w-[220px]">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {t("common.labels.status")}
            </label>
            <AdminSelect<SupportFilters["status"]>
              value={inputFilters.status}
              onValueChange={(value) => setInputFilter("status", value)}
              options={[
                { value: "all", label: t("common.filters.allStatuses") },
                ...STATUS_OPTIONS.map((value) => ({
                  value,
                  label: t(`support.statusOptions.${value}`),
                })),
              ]}
            />
          </div>

          <div className="sm:w-[220px]">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {t("common.labels.category")}
            </label>
            <AdminSelect<SupportFilters["category"]>
              value={inputFilters.category}
              onValueChange={(value) => setInputFilter("category", value)}
              options={[
                { value: "all", label: t("common.filters.allCategories") },
                ...CATEGORY_OPTIONS.map((value) => ({
                  value,
                  label: t(`support.categoryOptions.${value}`),
                })),
              ]}
            />
          </div>
        </>
      }
    />
  );
}

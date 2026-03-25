"use client";

import type { PrimitiveFilterValue } from "@/types/system/filters";

type FilterState = Record<string, PrimitiveFilterValue>;

type UseAdminFiltersOptions<TFilters extends FilterState> = {
  inputFilters: TFilters;
  appliedFilters: TFilters;
  setInputFilter: <K extends keyof TFilters>(key: K, value: TFilters[K]) => void;
  applyFilters: () => void;
  clearFilters: () => void;
};

export function useAdminFilters<TFilters extends FilterState>(
  options: UseAdminFiltersOptions<TFilters>
) {
  return {
    inputFilters: options.inputFilters,
    appliedFilters: options.appliedFilters,
    setInputFilter: options.setInputFilter,
    applyFilters: options.applyFilters,
    clearFilters: options.clearFilters,
  };
}

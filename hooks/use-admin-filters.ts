import { useTableQueryState } from "./use-table-query-state";

type UseAdminFiltersOptions<TFilters extends Record<string, string>> = {
  defaultFilters: TFilters;
};

export function useAdminFilters<TFilters extends Record<string, string>>(
  options: UseAdminFiltersOptions<TFilters>
) {
  const { defaultFilters } = options;

  const tableState = useTableQueryState<TFilters>({
    filters: defaultFilters,
  });

  return {
    inputFilters: tableState.inputFilters,
    appliedFilters: tableState.appliedFilters,

    setInputFilter: tableState.setInputFilter,
    applyFilters: tableState.applyFilters,
    applyNextFilters: tableState.applyNextFilters,
    clearFilters: tableState.clearFilters,

    currentPage: tableState.currentPage,
    setCurrentPage: tableState.setCurrentPage,
  };
}
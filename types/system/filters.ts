export type PrimitiveFilterValue = string;

export type SystemFilterState = Record<string, PrimitiveFilterValue>;

export type SetInputFilter<TFilters extends Record<string, unknown>> = <
  K extends keyof TFilters
>(
  key: K,
  value: TFilters[K]
) => void;

export type FilterBarBaseProps<TFilters extends Record<string, string>> = {
  inputFilters: TFilters;
  setInputFilter: <K extends keyof TFilters>(
    key: K,
    value: TFilters[K]
  ) => void;
  applyFilters: () => void;
  clearFilters: () => void;
};
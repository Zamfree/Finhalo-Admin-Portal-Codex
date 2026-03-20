import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  width?: string;
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | null;
  onSort?: () => void;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  minWidthClassName?: string;
  className?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  minWidthClassName = "min-w-[760px]",
  className = "",
  rowClassName,
  onRowClick,
  emptyMessage = "No data",
}: DataTableProps<T>) {
  function getRowClassName(row: T, index: number) {
  const baseClassName =
    typeof rowClassName === "function"
      ? rowClassName(row, index)
      : rowClassName ??
        "border-b border-white/5 text-zinc-200 odd:bg-transparent even:bg-white/[0.02] transition-all last:border-0";

  return `${baseClassName} ${
    onRowClick ? "cursor-pointer hover:bg-white/5" : ""
  }`;
}

  function renderHeaderContent(column: DataTableColumn<T>) {
  if (!column.sortable) {
    return column.header;
  }

  return (
    <button
      type="button"
      onClick={column.onSort}
      className="inline-flex items-center gap-1 transition hover:text-zinc-300"
    >
      <span>{column.header}</span>
      <span className="text-[10px] text-zinc-600">
        {column.sortDirection === "asc"
          ? "↑"
          : column.sortDirection === "desc"
          ? "↓"
          : "↕"}
      </span>
    </button>
  );
}

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className={`w-full ${minWidthClassName} table-fixed text-left text-sm`}>
        <colgroup>
          {columns.map((column) => (
            <col
              key={column.key}
              style={column.width ? { width: column.width } : undefined}
            />
          ))}
        </colgroup>

        <thead>
          <tr className="border-b border-white/5">
            {columns.map((column) => (
              <th
                key={column.key}
                className={
                  column.headerClassName ??
                  "py-3 pr-6 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500"
                }
              >
                {renderHeaderContent(column)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-6 text-center text-sm text-zinc-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={getRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={getRowClassName(row, index)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={column.cellClassName ?? "py-4 pr-6 align-middle text-sm text-zinc-200"}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
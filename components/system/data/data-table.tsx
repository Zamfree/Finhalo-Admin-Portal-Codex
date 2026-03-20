import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  minWidthClassName?: string;
  className?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  emptyMessage?: string;
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  minWidthClassName = "min-w-[760px]",
  className = "",
  rowClassName,
  emptyMessage = "No data",
}: DataTableProps<T>) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className={`w-full ${minWidthClassName} text-left text-sm`}>
        <thead>
          <tr className="border-b border-white/5">
            {columns.map((column) => (
              <th
                key={column.key}
                className={
                  column.headerClassName ??
                  "py-3 pr-4 text-xs font-medium uppercase tracking-wide text-zinc-500"
                }
              >
                {column.header}
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
                className={
                  typeof rowClassName === "function"
                    ? rowClassName(row, index)
                    : rowClassName ??
                      "border-b border-white/5 text-zinc-200 odd:bg-transparent even:bg-white/[0.02] transition-all hover:bg-white/5 last:border-0"
                }
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={column.cellClassName ?? "py-4 pr-4 text-zinc-200"}
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
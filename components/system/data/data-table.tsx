"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  width?: string;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number;
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
  isLoading?: boolean;
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
  isLoading,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc" | null>(null);

  const sortedRows = React.useMemo(() => {
    if (!sortKey || !sortDirection) return rows;

    const activeColumn = columns.find((column) => column.key === sortKey);
    if (!activeColumn?.sortAccessor) return rows;

    return [...rows].sort((a, b) => {
      const aValue = activeColumn.sortAccessor!(a);
      const bValue = activeColumn.sortAccessor!(b);

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }

      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1;
      }

      return 0;
    });
  }, [rows, columns, sortKey, sortDirection]);

  function getRowClassName(row: T, index: number) {
    const baseClassName =
      typeof rowClassName === "function"
        ? rowClassName(row, index)
        : (rowClassName ?? "text-zinc-200 even:bg-white/[0.02] hover:bg-white/[0.04]");

    return `${baseClassName} ${onRowClick ? "cursor-pointer" : ""}`;
  }

  function renderHeaderContent(column: DataTableColumn<T>) {
    if (!column.sortable) {
      return column.header;
    }

    const isActive = sortKey === column.key;

    return (
      <span className="inline-flex items-center gap-1">
        {column.header}

        <span className="text-[10px] text-zinc-500">
          {!isActive
            ? "↕"
            : sortDirection === "asc"
              ? "↑"
              : "↓"}
        </span>
      </span>
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
                onClick={() => {
                  if (!column.sortable) return;

                  if (sortKey !== column.key) {
                    setSortKey(column.key);
                    setSortDirection("asc");
                  } else if (sortDirection === "asc") {
                    setSortDirection("desc");
                  } else {
                    setSortKey(null);
                    setSortDirection(null);
                  }
                }}
                className={cn(
                  "py-3 pr-6 text-[11px] font-medium uppercase tracking-[0.12em]",
                  sortKey === column.key ? "text-zinc-100" : "text-zinc-400",
                  column.sortable && "cursor-pointer select-none",
                  column.headerClassName
                )}
              >
                {renderHeaderContent(column)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="admin-surface-soft flex min-h-32 items-center justify-center rounded-xl p-6 text-sm text-zinc-500">
                  Loading...
                </div>
              </td>
            </tr>
          ) : sortedRows.length === 0 ? (<tr>
            <td colSpan={columns.length}>
              <div className="admin-surface-soft flex min-h-32 items-center justify-center rounded-xl p-6 text-sm text-zinc-500">
                {emptyMessage}
              </div>
            </td>
          </tr>
          ) : (
            sortedRows.map((row, index) => (
              <tr
                key={getRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-white/5 transition-colors duration-150 hover:bg-white/[0.04] active:bg-white/[0.05] ${getRowClassName(row, index)}`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={
                      column.cellClassName ??
                      "py-3 pr-6 align-middle text-sm text-zinc-200"
                    }
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

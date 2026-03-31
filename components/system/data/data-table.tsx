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
  getRowAriaLabel?: (row: T) => string;
  emptyMessage?: string;
  isLoading?: boolean;
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  minWidthClassName = "min-w-[680px]",
  className = "",
  rowClassName,
  onRowClick,
  getRowAriaLabel,
  emptyMessage = "No data",
  isLoading,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc" | null>(null);

  const activeSortColumn = React.useMemo(
    () => columns.find((column) => column.key === sortKey),
    [columns, sortKey]
  );

  const sortedRows = React.useMemo(() => {
    const sortAccessor = activeSortColumn?.sortAccessor;

    if (!sortAccessor || !sortDirection) {
      return rows;
    }

    return [...rows].sort((a, b) => {
      const aValue = sortAccessor(a);
      const bValue = sortAccessor(b);

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, activeSortColumn, sortDirection]);

  function getRowClassName(row: T, index: number) {
    const baseClassName =
      typeof rowClassName === "function"
        ? rowClassName(row, index)
        : (rowClassName ?? "text-zinc-200 even:bg-white/[0.012] hover:bg-white/[0.02]");

    return `${baseClassName} ${onRowClick ? "cursor-pointer" : ""}`;
  }

  function handleSort(column: DataTableColumn<T>) {
    if (!column.sortable) return;

    if (sortKey !== column.key) {
      setSortKey(column.key);
      setSortDirection("asc");
      return;
    }

    if (sortDirection === "asc") {
      setSortDirection("desc");
      return;
    }

    setSortKey(null);
    setSortDirection(null);
  }

  function getAriaSort(column: DataTableColumn<T>): "none" | "ascending" | "descending" {
    if (!column.sortable || sortKey !== column.key || !sortDirection) {
      return "none";
    }

    return sortDirection === "asc" ? "ascending" : "descending";
  }

  function renderHeaderContent(column: DataTableColumn<T>) {
    if (!column.sortable) {
      return column.header;
    }

    const isActive = sortKey === column.key;
    const indicator = !isActive ? "<>" : sortDirection === "asc" ? "^" : "v";

    return (
      <span className="inline-flex items-center gap-1">
        {column.header}
        <span aria-hidden="true" className="text-[10px] text-zinc-500">
          {indicator}
        </span>
      </span>
    );
  }

  function handleRowKeyDown(event: React.KeyboardEvent<HTMLTableRowElement>, row: T) {
    if (!onRowClick) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick(row);
    }
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className={`w-full ${minWidthClassName} table-fixed text-left text-sm`}>
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={column.width ? { width: column.width } : undefined} />
          ))}
        </colgroup>

        <thead>
          <tr className="border-b border-white/5">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                aria-sort={getAriaSort(column)}
                className={cn(
                  "py-3.5 pr-6 text-[11px] font-medium uppercase tracking-[0.1em]",
                  sortKey === column.key ? "text-zinc-100" : "text-zinc-400",
                  column.headerClassName
                )}
              >
                {column.sortable ? (
                  <button
                    type="button"
                    onClick={() => handleSort(column)}
                    className="inline-flex cursor-pointer select-none items-center gap-1 transition-colors hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/30"
                  >
                    {renderHeaderContent(column)}
                  </button>
                ) : (
                  renderHeaderContent(column)
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length}>
                <div
                  className="admin-surface-soft flex min-h-32 items-center justify-center rounded-2xl p-6 text-sm text-zinc-500"
                  role="status"
                  aria-live="polite"
                >
                  Loading...
                </div>
              </td>
            </tr>
          ) : sortedRows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div
                  className="admin-surface-soft flex min-h-32 items-center justify-center rounded-2xl p-6 text-sm text-zinc-500"
                  role="status"
                  aria-live="polite"
                >
                  {emptyMessage}
                </div>
              </td>
            </tr>
          ) : (
            sortedRows.map((row, index) => (
              <tr
                key={getRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (event) => handleRowKeyDown(event, row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? "button" : undefined}
                aria-label={onRowClick ? getRowAriaLabel?.(row) ?? "Open row details" : undefined}
                className={`border-b border-white/5 transition-colors duration-150 hover:bg-white/[0.02] active:bg-white/[0.03] focus-visible:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/30 ${getRowClassName(
                  row,
                  index
                )}`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={column.cellClassName ?? "py-3.5 pr-6 align-middle text-sm text-zinc-200"}
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


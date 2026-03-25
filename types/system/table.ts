import type { ReactNode } from "react";

export type SystemTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  width?: string;
};

export type SystemTableQuery = {
  page: number;
  pageSize: number;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
};

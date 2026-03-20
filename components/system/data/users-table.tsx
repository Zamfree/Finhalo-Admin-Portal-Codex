"use client";

import { useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "./data-table";
import type { UserRow } from "@/types/user";

type UsersTableProps = {
  rows: UserRow[];
  onOpenDetail: (user: UserRow) => void;
};

type SortKey = "user_id" | "email" | "created_at";
type SortDirection = "asc" | "desc";

function getuser_typeBadgeClass(user_type: string) {
  switch (user_type) {
    case "ib":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    case "trader":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    default:
      return "border-zinc-500/30 bg-zinc-500/10 text-zinc-300";
  }
}

export function UsersTable({ rows, onOpenDetail }: UsersTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  function handleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection("asc");
  }

  const sortedRows = useMemo(() => {
    const nextRows = [...rows];

    nextRows.sort((a, b) => {
      let comparison = 0;

      if (sortKey === "user_id") {
        comparison = a.user_id.localeCompare(b.user_id);
      }

      if (sortKey === "email") {
        comparison = a.email.localeCompare(b.email);
      }

      if (sortKey === "created_at") {
        comparison =
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime();
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return nextRows;
  }, [rows, sortKey, sortDirection]);

  const columns: DataTableColumn<UserRow>[] = [
    {
      key: "user_id",
      header: "User ID",
      width: "170px",
      sortable: true,
      sortDirection: sortKey === "user_id" ? sortDirection : null,
      onSort: () => handleSort("user_id"),
      cell: (user) => user.user_id,
      headerClassName:
        "py-3 pr-6 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName:
        "py-4 pr-6 align-middle font-mono text-sm text-zinc-300 whitespace-nowrap",
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      sortDirection: sortKey === "email" ? sortDirection : null,
      onSort: () => handleSort("email"),
      cell: (user) => (
        <span className="block truncate text-[15px] font-medium text-white">
          {user.email}
        </span>
      ),
      headerClassName:
        "py-3 pr-6 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName: "py-4 pr-6 align-middle",
    },
    {
      key: "user_type",
      header: "User Type",
      cell: (user) => (
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] ${getuser_typeBadgeClass(
            user.user_type
          )}`}
        >
          {user.user_type}
        </span>
      ),
      headerClassName:
        "py-3 pr-6 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName: "py-4 pr-6 align-middle",
    },
    {
      key: "created_at",
      header: "Created At",
      width: "220px",
      sortable: true,
      sortDirection: sortKey === "created_at" ? sortDirection : null,
      onSort: () => handleSort("created_at"),
      cell: (user) => {
        const date = new Date(user.created_at);
        return `${date.getFullYear()}/${String(
          date.getMonth() + 1
        ).padStart(2, "0")}/${String(date.getDate()).padStart(
          2,
          "0"
        )} ${String(date.getHours()).padStart(2, "0")}:${String(
          date.getMinutes()
        ).padStart(2, "0")}`;
      },
      headerClassName:
        "py-3 pr-0 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName:
        "py-4 pr-0 align-middle whitespace-nowrap text-sm text-zinc-400",
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={sortedRows}
      getRowKey={(user) => user.user_id}
      onRowClick={onOpenDetail}
    />
  );
}
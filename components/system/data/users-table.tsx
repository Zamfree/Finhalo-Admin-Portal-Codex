"use client";

import { DataTable, type DataTableColumn } from "./data-table";
import type { UserRow } from "@/types/user";

type UsersTableProps = {
  rows: UserRow[];
  onOpenDetail: (user: UserRow) => void;
};

function getUserTypeBadgeClass(user_type: string) {
  switch (user_type) {
    case "ib":
      return "bg-blue-500/10 text-blue-300";
    case "trader":
      return "bg-emerald-500/10 text-emerald-300";
    default:
      return "bg-zinc-500/10 text-zinc-300";
  }
}

function formatCreatedAt(value: string) {
  const date = new Date(value);

  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}/${String(date.getDate()).padStart(2, "0")} ${String(
    date.getHours()
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function UsersTable({ rows, onOpenDetail }: UsersTableProps) {
  const columns: DataTableColumn<UserRow>[] = [
    {
      key: "user_id",
      header: "User ID",
      width: "170px",
      sortable: true,
      sortAccessor: (user) => user.user_id,
      cell: (user) => user.user_id,
      cellClassName:
        "py-3 pr-6 align-middle font-mono text-sm text-zinc-300 whitespace-nowrap",
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      sortAccessor: (user) => user.email,
      cell: (user) => (
        <span className="block truncate text-[15px] font-medium text-white">
          {user.email}
        </span>
      ),
      cellClassName: "py-3 pr-6 align-middle",
    },
    {
      key: "user_type",
      header: "User Type",
      cell: (user) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getUserTypeBadgeClass(
            user.user_type
          )}`}
        >
          {user.user_type}
        </span>
      ),
      cellClassName: "py-3 pr-6 align-middle",
    },
    {
      key: "created_at",
      header: "Created At",
      width: "220px",
      sortable: true,
      sortAccessor: (user) => new Date(user.created_at).getTime(),
      cell: (user) => formatCreatedAt(user.created_at),
      cellClassName:
        "py-3 pr-0 align-middle whitespace-nowrap text-sm text-zinc-400",
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowKey={(user) => user.user_id}
      onRowClick={onOpenDetail}
    />
  );
}
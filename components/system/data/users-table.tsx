import Link from "next/link";

import { DataTable, type DataTableColumn } from "@/components/system/data/data-table";

type UserRow = {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
};

type UsersTableProps = {
  rows: UserRow[];
};

export function UsersTable({ rows }: UsersTableProps) {
  const columns: DataTableColumn<UserRow>[] = [
    {
      key: "user_id",
      header: "User ID",
      cell: (user: UserRow) => user.user_id,
      cellClassName: "py-3 pr-4 font-mono text-xs",
    },
    {
      key: "email",
      header: "Email",
      cell: (user: UserRow) => user.email,
    },
    {
      key: "role",
      header: "Role",
      cell: (user: UserRow) => (
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs uppercase tracking-wide text-zinc-300">
          {user.role}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Created At",
      cell: (user: UserRow) => new Date(user.created_at).toLocaleString(),
      cellClassName: "py-3 pr-4 text-zinc-400",
    },
    {
  key: "action",
  header: "Action",
  cell: (user: UserRow) => (
    <Link
      href={`/admin/users/${user.user_id}`}
      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
    >
      Open detail
    </Link>
  ),
},
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowKey={(user) => user.user_id}
    />
  );
}

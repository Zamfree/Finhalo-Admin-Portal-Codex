import type { ReactNode } from "react";
import type { DataTableColumn } from "@/components/system/data/data-table";
import type { UserRow } from "@/types/user";
import { getAccountsForUser } from "./_mock-data";

export function SummaryCard({
  label,
  value,
  emphasis = "default",
}: {
  label: string;
  value: ReactNode;
  emphasis?: "default" | "strong";
}) {
  return (
    <div
      className={`admin-surface-soft rounded-2xl p-4 ${
        emphasis === "strong" ? "border-white/10 bg-white/[0.04]" : ""
      }`}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-2 font-semibold tabular-nums text-white ${
          emphasis === "strong" ? "text-xl" : "text-lg"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function getStatusClass(status: UserRow["status"]) {
  if (status === "active") return "bg-emerald-500/10 text-emerald-300";
  if (status === "restricted") return "bg-amber-500/10 text-amber-300";
  return "bg-rose-500/10 text-rose-300";
}

export const userColumns: DataTableColumn<UserRow>[] = [
  {
    key: "user_id",
    header: "User ID",
    cell: (row) => row.user_id,
    cellClassName: "py-3 pr-4 font-mono text-sm text-zinc-300",
  },
  {
    key: "email",
    header: "Email",
    cell: (row) => <span className="font-medium text-white">{row.email}</span>,
    cellClassName: "py-3 pr-4",
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => (
      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${getStatusClass(row.status)}`}>
        {row.status}
      </span>
    ),
    cellClassName: "py-3 pr-4",
  },
  {
    key: "account_count",
    header: "Account Count",
    cell: (row) => getAccountsForUser(row.user_id).length,
    headerClassName:
      "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
    cellClassName: "py-3 pr-4 text-right tabular-nums text-white",
  },
  {
    key: "primary_context",
    header: "Main Account Context",
    cell: (row) => {
      const account = getAccountsForUser(row.user_id)[0] ?? null;

      return account ? (
        <div className="space-y-1">
          <p className="text-sm text-zinc-300">{account.broker}</p>
          <p className="font-mono text-xs text-zinc-500">{account.account_id}</p>
        </div>
      ) : (
        <span className="text-sm text-zinc-500">No linked account</span>
      );
    },
    cellClassName: "py-3 pr-4",
  },
  {
    key: "created_at",
    header: "Created At",
    cell: (row) => new Date(row.created_at).toLocaleString(),
    cellClassName: "py-3 pr-4 text-sm text-zinc-400",
  },
];

import type { DataTableColumn } from "@/components/system/data/data-table";
import { StatusBadge } from "@/components/system/feedback/status-badge";
import type { TradingAccountRecord } from "../accounts/_types";
import type { UserRow } from "./_types";

export { SummaryCard } from "@/components/system/cards/summary-card";

function getStatusClass(status: UserRow["status"]) {
  if (status === "active") return "bg-emerald-500/10 text-emerald-300";
  if (status === "restricted") return "bg-amber-500/10 text-amber-300";
  return "bg-rose-500/10 text-rose-300";
}

export function getUserColumns(
  ownedAccountsByUser: Record<string, TradingAccountRecord[]>
): DataTableColumn<UserRow>[] {
  return [
    {
      key: "user_id",
      header: "User",
      cell: (row) => (
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-medium text-white">{row.display_name}</p>
          <div className="flex min-w-0 flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span className="min-w-0 truncate">{row.email}</span>
            <span className="font-mono">{row.user_id}</span>
          </div>
        </div>
      ),
      cellClassName: "py-3 pr-4",
    },
    {
      key: "identity",
      header: "Identity",
      cell: (row) => (
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">{row.user_type}</p>
          <p className="text-xs text-zinc-500">
            Created {new Date(row.created_at).toLocaleDateString()}
          </p>
        </div>
      ),
      cellClassName: "py-3 pr-4",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge toneClassName={getStatusClass(row.status)}>
          {row.status}
        </StatusBadge>
      ),
      cellClassName: "py-3 pr-4",
    },
    {
      key: "account_count",
      header: "Owned Accounts",
      cell: (row) => (ownedAccountsByUser[row.user_id] ?? []).length,
      headerClassName:
        "py-2.5 pr-4 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      cellClassName: "py-3 pr-4 text-right tabular-nums text-white",
    },
    {
      key: "primary_context",
      header: "Primary Account Context",
      cell: (row) => {
        const account = ownedAccountsByUser[row.user_id]?.[0] ?? null;

        return account ? (
          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm text-zinc-300">{account.broker}</p>
            <p className="font-mono text-xs text-zinc-500">{account.account_id}</p>
          </div>
        ) : (
          <span className="text-sm text-zinc-500">No linked account</span>
        );
      },
      cellClassName: "py-3 pr-4",
    },
  ];
}

import type { DataTableColumn } from "@/components/system/data/data-table";
import { StatusBadge } from "@/components/system/feedback/status-badge";
import type { TradingAccountRecord } from "./_types";

export { SummaryCard } from "@/components/system/cards/summary-card";

export function getAccountColumns(
  t: (key: string) => string
): DataTableColumn<TradingAccountRecord>[] {
  function roleValue(value?: string | null) {
    return value ?? "—";
  }

  function getStatusClass(status: TradingAccountRecord["status"]) {
    if (status === "active") return "bg-emerald-500/10 text-emerald-300";
    if (status === "monitoring") return "bg-amber-500/10 text-amber-300";
    return "bg-rose-500/10 text-rose-300";
  }

  return [
    {
      key: "account_id",
      header: t("common.labels.accountId"),
      cell: (row) => (
        <div className="min-w-0 space-y-1">
          <p className="truncate font-mono text-sm text-white">{row.account_id}</p>
          <p className="text-xs text-zinc-500">
            {t("common.labels.createdAt")} {new Date(row.created_at).toLocaleDateString()}
          </p>
        </div>
      ),
      cellClassName: "py-3 pr-4",
    },
    {
      key: "broker",
      header: `${t("common.labels.broker")} / ${t("account.accountType")}`,
      cell: (row) => (
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium text-white">{row.broker}</p>
          <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">{row.account_type}</p>
        </div>
      ),
      cellClassName: "py-3 pr-4",
    },
    {
      key: "status",
      header: t("common.labels.status"),
      cell: (row) => (
        <div className="min-w-0 space-y-1">
          <StatusBadge toneClassName={getStatusClass(row.status)}>{row.status}</StatusBadge>
          <p className="truncate text-xs text-zinc-500">{row.trader_display_name}</p>
        </div>
      ),
      cellClassName: "py-3 pr-4",
    },
    {
      key: "owner",
      header: t("account.owner"),
      cell: (row) => (
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-medium text-white">{row.user_display_name}</p>
          <div className="flex min-w-0 flex-wrap items-center gap-3 text-xs text-zinc-500">
            <span className="min-w-0 truncate">{row.user_email}</span>
            <span className="font-mono">{row.user_id}</span>
          </div>
        </div>
      ),
      cellClassName: "py-3 pr-4",
    },
    {
      key: "relationship",
      header: t("account.relationshipSnapshot"),
      cell: (row) => (
        <div className="min-w-0 space-y-1">
          <p className="truncate font-mono text-xs text-zinc-400">{row.relationship_snapshot_id}</p>
          <p className="break-words text-xs text-zinc-500">
            {t("account.trader")}: {row.trader_display_name} {"->"} {t("account.l1Ib")}:{" "}
            {row.l1_ib_display_name ?? roleValue(row.l1_ib_id)} {"->"} {t("account.l2Ib")}:{" "}
            {row.l2_ib_display_name ?? roleValue(row.l2_ib_id)}
          </p>
        </div>
      ),
      cellClassName: "py-3 pr-4",
    },
  ];
}

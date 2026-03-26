import type { DataTableColumn } from "@/components/system/data/data-table";
import { StatusBadge } from "@/components/system/feedback/status-badge";
import type { SupportTicket, SupportRelatedModule } from "./_types";

export { SummaryCard } from "@/components/system/cards/summary-card";

export function getPriorityClass(priority: SupportTicket["priority"]) {
  if (priority === "urgent") return "bg-rose-500/10 text-rose-300";
  if (priority === "high") return "bg-amber-500/10 text-amber-300";
  if (priority === "medium") return "bg-blue-500/10 text-blue-300";
  return "bg-zinc-500/10 text-zinc-300";
}

export function getStatusClass(status: SupportTicket["status"]) {
  if (status === "open") return "bg-white/[0.08] text-zinc-200";
  if (status === "in_progress") return "bg-white/[0.07] text-zinc-300";
  if (status === "waiting_user") return "bg-white/[0.06] text-zinc-300";
  if (status === "resolved") return "bg-white/[0.06] text-zinc-300";
  return "bg-white/[0.05] text-zinc-400";
}

function getModuleLabel(module: SupportRelatedModule) {
  switch (module) {
    case "accounts":
      return "Accounts";
    case "commission":
      return "Commission";
    case "finance":
      return "Finance";
    case "withdrawals":
      return "Withdrawals";
    case "verification":
      return "Verification";
    case "technical":
      return "Technical";
    default:
      return "General";
  }
}

function getContextCount(row: SupportTicket) {
  return [
    row.account_id,
    row.commission_id,
    row.rebate_record_id,
    row.ledger_ref,
    row.withdrawal_id,
  ].filter(Boolean).length;
}

export function getSupportColumns(t: (key: string) => string): DataTableColumn<SupportTicket>[] {
  return [
    {
      key: "ticket_id",
      header: "Case",
      cell: (row) => (
        <div className="min-w-0 space-y-1">
          <p className="truncate font-mono text-sm text-zinc-200">{row.ticket_id}</p>
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">
            {new Date(row.created_at).toLocaleDateString()}
          </p>
        </div>
      ),
      cellClassName: "py-3 pr-4",
    },
    {
      key: "subject",
      header: "Issue Summary",
      cell: (row) => (
        <div className="min-w-0 space-y-1">
          <p className="break-words font-medium text-white">{row.subject}</p>
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-zinc-500">
            <span>{t(`support.categoryOptions.${row.category}`)}</span>
            <span>{getModuleLabel(row.related_module)}</span>
          </div>
        </div>
      ),
      cellClassName: "py-3 pr-4",
    },
    {
      key: "status",
      header: "Case State",
      cell: (row) => (
        <div className="space-y-2">
          <StatusBadge toneClassName={getStatusClass(row.status)}>
            {t(`support.statusOptions.${row.status}`)}
          </StatusBadge>
          <StatusBadge toneClassName={getPriorityClass(row.priority)}>
            {row.priority}
          </StatusBadge>
        </div>
      ),
      cellClassName: "py-3 pr-4",
    },
    {
      key: "requester",
      header: t("support.requester"),
      cell: (row) => (
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm text-zinc-200">{row.user_email}</p>
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="font-mono">{row.user_id}</span>
            {row.account_id ? <span className="font-mono">{row.account_id}</span> : null}
          </div>
        </div>
      ),
      cellClassName: "py-3 pr-4",
    },
    {
      key: "context",
      header: "Investigation Context",
      cell: (row) => (
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm text-zinc-200">{getModuleLabel(row.related_module)}</p>
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span>{getContextCount(row)} linked refs</span>
            <span>{row.account_id ? "Account-linked" : "No account"}</span>
          </div>
        </div>
      ),
      cellClassName: "py-3 pr-4",
    },
    {
      key: "updated_at",
      header: "Latest Activity",
      cell: (row) => (
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-zinc-300">{new Date(row.updated_at).toLocaleString()}</p>
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">
            Investigation updated
          </p>
        </div>
      ),
      cellClassName: "py-3 pr-4",
    },
  ];
}
